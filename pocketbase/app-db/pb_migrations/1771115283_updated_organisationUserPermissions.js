/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_230240349")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\" && \n@collection.organisationUserPermissions.userId ?= @request.auth.id && \n@collection.organisationUserPermissions.organisationId ?= organisationId && \n@collection.organisationUserPermissions.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_230240349")

  // update collection data
  unmarshal({
    "viewRule": null
  }, collection)

  return app.save(collection)
})
