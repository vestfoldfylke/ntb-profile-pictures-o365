(async () => {
  const { sendEmail } = require('./lib/send-email')
  const { updateGraphPhoto } = require('./lib/call-graph')
  const { IMPORTED_KEYWORD, MAIL } = require('./config')
  const { createLocalLogger } = require('./lib/local-logger')
  const { validateUserFromPhoto } = require('./lib/validate-user-from-photo')
  const { getPhotosFromAlbum, getPreviewPhotoAsBase64, getPreviewPhotoRaw, updatePhoto, getNtbUsers } = require('./lib/call-ntb')
  const { logger, logConfig } = require('@vtfk/logger')
  const { writeFileSync } = require('fs')

  logConfig({
    prefix: '',
    teams: {
      onlyInProd: false
    },
    localLogger: createLocalLogger('main')
  })
  let ntbUsers
  logger('info', ['Henter alle brukere fra NTB'])
  try {
    ntbUsers = await getNtbUsers()
  } catch (error) {
    logger('error', ['Feilet ved henting av brukere fra NTB.', error.response?.data || error.stack || error.toString()])
    process.exit(1)
  }
  let photos
  logger('info', ['Henter alle fotos fra profilbildealbumet'])
  try {
    photos = await getPhotosFromAlbum()
  } catch (error) {
    logger('error', ['Feilet ved henting av fotos fra profilbildealbumet.', error.response?.data || error.stack || error.toString()])
    process.exit(1)
  }
  logger('info', ['Filtrerer vekk fotos som allerede er importert'])
  const photosNotImported = photos.filter(photo => !photo.keywords.includes(IMPORTED_KEYWORD))
  writeFileSync('./ignore/allPhotos.json', JSON.stringify(photos, null, 2))
  // filtrere vekk de som allerede er importert i M365
  const photosWithUserData = []
  const uploaderWithErrorPhotos = []
  const photosWithErrors = []
  // let index = 0 // just for testing
  for (const photo of photosNotImported) {
    try {
      logger('info', [`Leter etter rett bruker for foto ${photo.file.originalFilename} - ${photo.headline}`])
      const user = await validateUserFromPhoto(photo)
      if (user) {
        photosWithUserData.push({ photo, user })
        logger('info', [`Fant bruker: ${user.userPrincipalName} for foto: ${photo.file.originalFilename} - ${photo.headline}`])
      } else {
        const ntbUploader = ntbUsers.find(user => user.externalId === photo.userId)
        if (!ntbUploader) throw new Error(`Fant ikke bruker i NTB med externalId: ${photo.userId} Her må noen sjekke bildet og evt rette det. Denne feilmeldingen bør egentlig ikke komme`)
        let currentNtbUploader = uploaderWithErrorPhotos.find(uploader => uploader.externalId === photo.userId)
        if (!currentNtbUploader) {
          currentNtbUploader = { ...ntbUploader, photosWithoutUserData: [] }
          uploaderWithErrorPhotos.push(currentNtbUploader)
        }
        logger('info', [`Fant ikke bruker for foto: ${photo.file.originalFilename} - ${photo.headline} - Legger til i lista uploaderWithErrorPhotos på bruker: ${ntbUploader.email}`])
        currentNtbUploader.photosWithoutUserData.push({ originalFileName: photo.file.originalFilename, headline: photo.headline, photoLink: photo._links.previewPage, id: photo.id })
      }
    } catch (error) {
      logger('error', [`Feilet ved validering og henting av bruker for foto ${photo.file.originalFilename} - ${photo.headline}`, error.response?.data || error.stack || error.toString()])
      photosWithErrors.push({ originalFileName: photo.file?.originalFilename, headline: photo.headline, photoLink: photo._links?.previewPage, id: photo.id, errorMessage: error.response?.data || error.stack || error.toString() })
    }
    // index++ // just for testing
    // if (index >= 5) break //just for testing
  }
  const photosToHandle = []
  logger('info', ['Sjekker om det finnes flere bilder på samme bruker og henter det nyeste'])
  for (const photo of photosWithUserData) {
    if (photosToHandle.find(photoToHandle => photoToHandle.user.userPrincipalName === photo.user.userPrincipalName)) continue
    const userPhotos = photosWithUserData.filter(userPhoto => userPhoto.user.userPrincipalName === photo.user.userPrincipalName)
    userPhotos.sort((userPhoto1, userPhoto2) => new Date(userPhoto2.photo.dateArchived) - new Date(userPhoto1.photo.dateArchived))
    let detGikkSkeis = false
    for (const userPhoto of userPhotos.slice(1)) { // setter importert-tag på evt. alternative bilder slik at disse ikke blir import ved neste kjøring (veldig spesiell case dersom noen har lastet opp flere bilder av samme person på samme dag)
      try {
        const propertiesToUpdate = {
          keywords: [...userPhoto.photo.keywords, IMPORTED_KEYWORD]
        }
        await updatePhoto(userPhoto.photo.id, propertiesToUpdate)
      } catch (error) {
        detGikkSkeis = true
        logger('error', [`Feilet ved oppdatering av metadata på foto i NTB - ${photo.photo.file.originalFilename}`, error.response?.data || error.stack || error.toString()])
        photosWithErrors.push({ originalFileName: userPhoto.photo?.file?.originalFilename, headline: userPhoto.photo?.headline, photoLink: userPhoto.photo?._links?.previewPage, id: userPhoto.photo?.id, errorMessage: error.response?.data || error.stack || error.toString() })
      }
    }
    if (!detGikkSkeis) photosToHandle.push(userPhotos[0])
  }
  for (const photo of photosToHandle) {
    let photoRaw
    try {
      logger('info', [`Henter preview foto for bruker: ${photo.user.userPrincipalName} - foto: ${photo.photo.file.originalFilename} - ${photo.photo.headline}`])
      photoRaw = await getPreviewPhotoRaw(photo.photo.previews['1024'].url)
    } catch (error) {
      logger('error', [`Feilet ved nedlasting av preview for ${photo.photo.file.originalFilename}`, error.response?.data || error.stack || error.toString()])
      photosWithErrors.push({ originalFileName: photo.photo?.file?.originalFilename, headline: photo.photo?.headline, photoLink: photo.photo?._links?.previewPage, id: photo.photo?.id, errorMessage: error.response?.data || error.stack || error.toString() })
      continue
    }
    try {
      logger('info', [`Oppdaterer foto for bruker i Graph: ${photo.user.userPrincipalName} - foto: ${photo.photo.file.originalFilename} - ${photo.photo.headline}`])
      await updateGraphPhoto(photo.user.userPrincipalName, photoRaw)
    } catch (error) {
      logger('error', [`Feilet ved oppdatering av bilde i Graph - ${photo.photo.file.originalFilename}`, error.response?.data || error.stack || error.toString()])
      photosWithErrors.push({ originalFileName: photo.photo?.file?.originalFilename, headline: photo.photo?.headline, photoLink: photo.photo?._links?.previewPage, id: photo.photo?.id, errorMessage: error.response?.data || error.stack || error.toString() })
      continue
    }
    try {
      logger('info', [`Oppdaterer metadata for foto for bruker i NTB: ${photo.user.userPrincipalName} - foto: ${photo.photo.file.originalFilename} - ${photo.photo.headline}`])
      const propertiesToUpdate = {
        keywords: [...photo.photo.keywords, IMPORTED_KEYWORD]
      }
      await updatePhoto(photo.photo.id, propertiesToUpdate)
    } catch (error) {
      logger('error', [`Feilet ved oppdatering av metadata på bildet i NTB - ${photo.photo.file.originalFilename}`, error.response?.data || error.stack || error.toString()])
      photosWithErrors.push({ originalFileName: photo.photo?.file?.originalFilename, headline: photo.photo?.headline, photoLink: photo.photo?._links?.previewPage, id: photo.photo?.id, errorMessage: error.response?.data || error.stack || error.toString() })
    }
  }
  writeFileSync('./ignore/photosWithUserData.json', JSON.stringify(photosWithUserData, null, 2))
  writeFileSync('./ignore/uploaderWithErrorPhotos.json', JSON.stringify(uploaderWithErrorPhotos, null, 2))
  if (uploaderWithErrorPhotos.length > 0) {
    for (const uploader of uploaderWithErrorPhotos) {
      const photosToFix = uploader.photosWithoutUserData.map(photo => {
        return `<li><a href="${photo.photoLink}">${photo.originalFileName} ${photo.headline ? ' (' + photo.headline + ')' : ''}</a></li>`
      })
      const emailBody = `Hei! <br><br>I forbindelse med din opplasting av profilbilder fra NTB Mediebank til M365, er det oppstått <b>${photosToFix.length}</b> feil som må fikses. Som oftest skyldes feilen at tittel 
      på bildet ikke er en gyldig epostadresse. Søk opp brukeren i for eksempel Teams eller Outlook, hent ut riktig epostadresse og endre tittelen på bildet. <b>Husk å lagre etterpå</b>. Dersom brukeren har sluttet, må du slette
      bildet. <br><br>Her følger listen over feil: <br><br><ul>${photosToFix.join('')}</ul><br>Det vil da bli gjort et nytt forsøk ved neste intervall.`

      const subject = 'Feillogg import av bilder til M365'
      try {
        logger('info', ['Sender epost med feilrapport til bruker som lastet opp bildene med feil navn'])
        await sendEmail([uploader.email], subject, emailBody) 
      } catch (error) {
        logger('error', ['Feilet ved sending av feilrapport', error.response?.data || error.stack || error.toString()])
      }
    }
  } else {
    logger('info', ['Nothing to report to uploaders'])
  }
  if (photosWithErrors.length > 0) {
    const photosToCheck = photosWithErrors.map(photo => {
      return `<li>${photo.id}-${photo.headline}-${photo.originalFileName}<a href="${photo.photoLink}">${photo.originalFileName} ${photo.headline ? ' (' + photo.headline + ')' : ''}</a> Error:${JSON.stringify(photo.errorMessage)}</li>`
    })
    const emailBody = `Øyøyøy! Her har det skjedd noe feil i forbindelse med overføring av profilbilder til O365<br>Her følger listen over feil: <br><br><ul>${photosToCheck.join('')}</ul><br>Det vil da bli gjort et nytt forsøk ved neste intervall.`
    const subject = 'Feilmeldinger ved import av bilder til M365'
    try {
      logger('info', ['Sender epost med error-rapport til utvikler'])
      await sendEmail(MAIL.DEVELOPER_EMAIL, subject, emailBody)
    } catch (error) {
      logger('error', ['Feilet ved sending av error-rapport til utvikler', error.response?.data || error.stack || error.toString()])
    }
  } else {
    logger('info', ['Nothing to report'])
    const emailBody = 'All is good!'
    const subject = 'Import av bilder til M365'
    try {
      logger('info', ['Sender epost med OK-rapport'])
      await sendEmail(MAIL.DEVELOPER_EMAIL, subject, emailBody)
    } catch (error) {
      logger('error', ['Feilet ved sending av OK-rapport', error.response?.data || error.stack || error.toString()])
    }
  }
  // map alle bilder i photoswithoutuserdata; returnerer en ny liste med det vi har gjort
  // For hvert bilde, lag et listelement-tag (LI) som inneholder eks. bildenavn, bildeid og lenka til bildet (a href)
  // Lag guide: søk opp bruker, kopier epostadresse og sett dette som tittel på bildet og lagre
})()

/*
For hvert bilde;

  hvis ikke eksisterende upn; send varsel til noen med bildenavnet. Varslet caches med utløpsdato. Slik at vi ikke sender nytt varsel på samme bilde før utløpsdatoen er nådd.

  (Gå gjennom bildene som har taggen importert satt, og sjekk om dette er det samme bildet som ligger i M365)

*/
