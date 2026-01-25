/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "id = @request.auth.id || @request.auth.id ?= globalUserPermissions_via_userId.userId && globalUserPermissions_via_userId.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "id = @request.auth.id || @request.auth.id ?= globalUserPermissions_via_userId.role && globalUserPermissions_via_userId.role = \"admin\""
  }, collection)

  return app.save(collection)
})
