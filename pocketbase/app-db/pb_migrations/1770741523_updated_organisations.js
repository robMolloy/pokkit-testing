/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1053844701")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && \n@collection.globalUserPermissions.userId ?= @request.auth.id && \n@collection.globalUserPermissions.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1053844701")

  // update collection data
  unmarshal({
    "createRule": null
  }, collection)

  return app.save(collection)
})
