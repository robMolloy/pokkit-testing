/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id = id || (@collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role = \"admin\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id=id || @collection.globalUserPermissions.id ?= @request.auth.id &&\n@collection.globalUserPermissions.role = \"admin\""
  }, collection)

  return app.save(collection)
})
