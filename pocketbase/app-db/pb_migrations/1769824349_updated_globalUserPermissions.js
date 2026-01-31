/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\" &&\n@collection.globalUserPermissions:auth.id = @request.auth.id &&\n@collection.globalUserPermissions:auth.role = \"admin\"\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2680520508")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id=id || @request.auth.id != \"\" &&\n@collection.globalUserPermissions:auth.id = @request.auth.id &&\n@collection.globalUserPermissions:auth.role = \"admin\"\n"
  }, collection)

  return app.save(collection)
})
