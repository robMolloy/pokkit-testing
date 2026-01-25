/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: null,
      deleteRule: null,
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          hidden: false,
          id: "text3208210256",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        {
          hidden: false,
          id: "select1466534506",
          maxSelect: 1,
          name: "role",
          presentable: false,
          required: false,
          system: false,
          type: "select",
          values: ["standard", "admin"],
        },
        {
          hidden: false,
          id: "select2063623452",
          maxSelect: 1,
          name: "status",
          presentable: false,
          required: false,
          system: false,
          type: "select",
          values: ["blocked", "approved", "pending"],
        },
        {
          cascadeDelete: true,
          collectionId: "_pb_users_auth_",
          hidden: false,
          id: "relation1689669068",
          maxSelect: 1,
          minSelect: 0,
          name: "userId",
          presentable: false,
          required: false,
          system: false,
          type: "relation",
        },
        {
          hidden: false,
          id: "autodate2990389176",
          name: "created",
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: "autodate",
        },
        {
          hidden: false,
          id: "autodate3332085495",
          name: "updated",
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: "autodate",
        },
      ],
      id: "pbc_2680520508",
      indexes: [],
      listRule: null,
      name: "globalUserPermissions",
      system: false,
      type: "base",
      updateRule: null,
      viewRule: null,
    });

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2680520508");

    return app.delete(collection);
  },
);
