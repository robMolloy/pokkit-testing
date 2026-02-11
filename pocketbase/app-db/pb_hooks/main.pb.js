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

onRecordCreateRequest((e) => {
  e.next();
  const organisation = e.record;

  const organisationUserPermissionsCollection = $app.findCollectionByNameOrId(
    "organisationUserPermissions",
  );

  const organisationUserPermissionsRecord = new Record(organisationUserPermissionsCollection);
  organisationUserPermissionsRecord.set("userId", e.auth.id);
  organisationUserPermissionsRecord.set("organisationId", organisation.id);
  organisationUserPermissionsRecord.set("role", "admin");
  organisationUserPermissionsRecord.set("status", "approved");
  organisationUserPermissionsRecord.set("userOrgKey", `${e.auth.id}-${organisation.id}`);

  $app.save(organisationUserPermissionsRecord);
}, "organisations");
