onTerminate((e) => {
  console.log("[custom hook] PocketBase is shutting down");

  e.next();
});

onRecordAfterCreateSuccess((e) => {
  const recordsCount = $app.countRecords("users");
  if (recordsCount === 1) {
    const user = e.record;
    const globalUserPermissionsCollection = $app.findCollectionByNameOrId("globalUserPermissions");

    const globalUserPermissionsRecord = new Record(globalUserPermissionsCollection);
    globalUserPermissionsRecord.set("id", user.id);
    globalUserPermissionsRecord.set("userId", user.id);
    globalUserPermissionsRecord.set("role", "admin");
    globalUserPermissionsRecord.set("status", "approved");

    $app.save(globalUserPermissionsRecord);
  }

  e.next();
}, "users");

onRecordAfterCreateSuccess((e) => {
  const organisation = e.record;

  const organisationUserPermissionsCollection = $app.findCollectionByNameOrId(
    "organisationUserPermissions",
  );

  const organisationUserPermissionsRecord = new Record(organisationUserPermissionsCollection);
  const createdByUserId = organisation.get("createdByUserId");

  organisationUserPermissionsRecord.set("userId", createdByUserId);
  organisationUserPermissionsRecord.set("organisationId", organisation.id);
  organisationUserPermissionsRecord.set("role", "admin");
  organisationUserPermissionsRecord.set("status", "approved");
  organisationUserPermissionsRecord.set("userOrgKey", `${createdByUserId}-${organisation.id}`);

  const x = $app.save(organisationUserPermissionsRecord);

  e.next();
}, "organisations");
