package main

import (
	"fmt"
	"log"
	"os"

	pocketbase "github.com/pocketbase/pocketbase"
	pbApis "github.com/pocketbase/pocketbase/apis"
	pbCore "github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *pbCore.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", pbApis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	app.OnTerminate().BindFunc(func(e *pbCore.TerminateEvent) error {
		log.Println("Hello, log!")

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess("users").BindFunc(func(e *pbCore.RecordEvent) error {
		log.Println("OnUserRecordAfterCreateSuccess")

		userRecord := e.Record
		userRecordsCount, err := e.App.CountRecords("users")

		if err != nil {
			log.Printf("Error counting user records: %v\n", err)
			return e.Next()
		}

		if userRecordsCount != 1 {
			return e.Next()
		}

		globalUserPermissionsCollection, err := e.App.FindCollectionByNameOrId("globalUserPermissions")
		if err != nil {
			log.Printf("Error finding globalUserPermissions collection: %v\n", err)
			return e.Next()
		}

		globalUserPermissionsRecord := pbCore.NewRecord(globalUserPermissionsCollection)
		globalUserPermissionsRecord.Set("id", userRecord.Id)
		globalUserPermissionsRecord.Set("userId", userRecord.Id)
		globalUserPermissionsRecord.Set("role", "admin")
		globalUserPermissionsRecord.Set("status", "approved")

		err = e.App.Save(globalUserPermissionsRecord)
		if err != nil {
			log.Printf("Error saving globalUserPermissions record: %v\n", err)
		}

		return e.Next()
	})

	app.OnRecordCreateRequest("organisations").BindFunc(func(e *pbCore.RecordRequestEvent) error {
		log.Println("OnOrganisationRecordCreateRequest")

		e.Next()

		organisationRecord := e.Record

		organisationUserPermissionsCollection, err := e.App.FindCollectionByNameOrId(
			"organisationUserPermissions",
		)
		if err != nil {
			log.Printf("Error finding organisationUserPermissions collection: %v\n", err)
			return e.Next()
		}

		organisationUserPermissionsRecord := pbCore.NewRecord(organisationUserPermissionsCollection)

		organisationUserPermissionsRecord.Set("userId", e.Auth.Id)
		organisationUserPermissionsRecord.Set("organisationId", organisationRecord.Id)
		organisationUserPermissionsRecord.Set("role", "admin")
		organisationUserPermissionsRecord.Set("status", "approved")
		organisationUserPermissionsRecord.Set("userOrgKey", fmt.Sprintf("%s-%s", e.Auth.Id, organisationRecord.Id))

		err = e.App.Save(organisationUserPermissionsRecord)
		if err != nil {
			log.Printf("Error saving organisationUserPermissions record: %v\n", err)
		}

		return e.Next()
	})

	app.OnRecordCreate("organisationDocuments").BindFunc(func(e *pbCore.RecordEvent) error {
		orgDocRecord := e.Record

		unsavedFiles := orgDocRecord.GetUnsavedFiles("file")
		unsavedFile := unsavedFiles[0]
		orgDocRecord.Set("versionNumber", 1)
		orgDocRecord.Set("fileName", unsavedFile.OriginalName)
		orgDocRecord.Set("fileSizeBytes", unsavedFile.Size)

		e.Next()

		if orgDocRecord.Get("id") == nil {
			return e.Next()
		}

		organisationDocumentVersionsCollection, err := e.App.FindCollectionByNameOrId(
			"organisationDocumentVersions",
		)
		if err != nil {
			log.Printf("Error finding organisationDocumentVersions collection: %v\n", err)
			return e.Next()
		}

		organisationDocumentVersionRecord := pbCore.NewRecord(organisationDocumentVersionsCollection)

		organisationDocumentVersionRecord.Set("versionNumber", orgDocRecord.Get("versionNumber"))
		organisationDocumentVersionRecord.Set("file", unsavedFile)
		organisationDocumentVersionRecord.Set("fileName", orgDocRecord.Get("fileName"))
		organisationDocumentVersionRecord.Set("fileSizeBytes", orgDocRecord.Get("fileSizeBytes"))
		organisationDocumentVersionRecord.Set("organisationId", orgDocRecord.Get("organisationId"))
		organisationDocumentVersionRecord.Set("organisationDocumentId", orgDocRecord.Get("id"))
		organisationDocumentVersionRecord.Set("docIdVersionNumberKey", fmt.Sprintf("%s-%s", orgDocRecord.Get("id"), orgDocRecord.Get("versionNumber")))

		return e.App.Save(organisationDocumentVersionRecord)
	})

	app.OnRecordUpdate("organisationDocuments").BindFunc(func(e *pbCore.RecordEvent) error {
		orgDocRecord := e.Record
		original := e.Record.Original()

		unsavedFiles := orgDocRecord.GetUnsavedFiles("file")
		unsavedFile := unsavedFiles[0]
		orgDocRecord.Set("versionNumber", original.GetFloat("versionNumber")+1)
		orgDocRecord.Set("fileName", unsavedFile.OriginalName)
		orgDocRecord.Set("fileSizeBytes", unsavedFile.Size)

		e.Next()

		if orgDocRecord.Get("id") == nil {
			return e.Next()
		}

		organisationDocumentVersionsCollection, err := e.App.FindCollectionByNameOrId(
			"organisationDocumentVersions",
		)
		if err != nil {
			log.Printf("Error finding organisationDocumentVersions collection: %v\n", err)
			return e.Next()
		}

		organisationDocumentVersionRecord := pbCore.NewRecord(organisationDocumentVersionsCollection)

		organisationDocumentVersionRecord.Set("versionNumber", orgDocRecord.Get("versionNumber"))
		organisationDocumentVersionRecord.Set("file", unsavedFile)
		organisationDocumentVersionRecord.Set("fileName", orgDocRecord.Get("fileName"))
		organisationDocumentVersionRecord.Set("fileSizeBytes", orgDocRecord.Get("fileSizeBytes"))
		organisationDocumentVersionRecord.Set("organisationId", orgDocRecord.Get("organisationId"))
		organisationDocumentVersionRecord.Set("organisationDocumentId", orgDocRecord.Get("id"))
		organisationDocumentVersionRecord.Set("docIdVersionNumberKey", fmt.Sprintf("%s-%s", orgDocRecord.Get("id"), orgDocRecord.Get("versionNumber")))

		return e.App.Save(organisationDocumentVersionRecord)
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
