/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" &&\n@collection.globalUserPermissions.userId ?= @request.auth.id &&\n@collection.globalUserPermissions.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id ?= globalUserPermissions_via_userId.userId && globalUserPermissions_via_userId.role = \"admin\""
  }, collection)

  return app.save(collection)
})
