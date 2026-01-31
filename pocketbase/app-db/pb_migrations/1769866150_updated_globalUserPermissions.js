/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id = userId || @collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role ?= \"admin\"\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "\n  @request.auth.id = userId || \n  @collection.globalUserPermissions.userId ?= @request.auth.id && \n  @collection.globalUserPermissions.role ?= \"admin\"\n"
  }, collection)

  return app.save(collection)
})
