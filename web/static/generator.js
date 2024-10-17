let schemaCount = 0;

function createElement(tag, innerHTML = "", attributes = {}) {
  const element = document.createElement(tag);
  element.innerHTML = innerHTML;
  Object.entries(attributes).forEach(([key, value]) =>
    element.setAttribute(key, value)
  );
  return element;
}

function addSchema() {
  const schemaId = `schema${schemaCount}`;
  const schemaDiv = createElement(
    "div",
    `
        <h2>Schema ${schemaCount + 1}</h2>
        <label for="${schemaId}Name">Schema Name:</label>
        <input type="text" id="${schemaId}Name" placeholder="Enter schema name" required>
        <button id="${schemaId}AddTable">Add Table</button>
        <div id="${schemaId}Tables"></div>
        <button id="${schemaId}RemoveSchema">Remove Schema</button>
    `
  );

  document.getElementById("schemas").appendChild(schemaDiv);
  schemaCount++;
}

function addTable(schemaId) {
  const tableId = `${schemaId}Table${
    document.getElementById(`${schemaId}Tables`).children.length
  }`;
  const tableDiv = createElement(
    "div",
    `
        <h3>Table</h3>
        <label for="${tableId}Name">Table Name:</label>
        <input type="text" id="${tableId}Name" placeholder="Enter table name" required>
        <label for="${tableId}AutoPrimaryKey">Auto Primary Key:</label>
        <input type="checkbox" id="${tableId}AutoPrimaryKey">
        <label for="${tableId}AutoTimestamps">Auto Timestamps:</label>
        <input type="checkbox" id="${tableId}AutoTimestamps">
        <button id="${tableId}AddAttribute">Add Attribute</button>
        <div id="${tableId}Attributes"></div>
        <button id="${tableId}RemoveTable">Remove Table</button>
    `
  );

  document.getElementById(`${schemaId}Tables`).appendChild(tableDiv);
}

function addAttribute(tableId) {
  const attributesDiv = document.getElementById(`${tableId}Attributes`);
  const attributeId = `${tableId}Attribute${attributesDiv.children.length}`;
  const attributeDiv = createElement(
    "div",
    `
        <label>Attribute Name:</label>
        <input type="text" id="${attributeId}Name" placeholder="Enter attribute name" required>
        <label>Attribute Type:</label>
        <input type="text" id="${attributeId}Type" placeholder="Enter attribute type" required>
        <label>Not Null:</label>
        <input type="checkbox" id="${attributeId}NotNull">
        <label>Min:</label>
        <input type="number" id="${attributeId}Min">
        <label>Max:</label>
        <input type="number" id="${attributeId}Max">
        <label>Primary Key:</label>
        <input type="checkbox" id="${attributeId}PrimaryKey">
        <label>Readonly:</label>
        <input type="checkbox" id="${attributeId}Readonly">
        <label>Default Value:</label>
        <input type="text" id="${attributeId}DefaultValue">
        <button id="${attributeId}Remove">Remove Attribute</button>
    `
  );

  attributesDiv.appendChild(attributeDiv);
}

function removeFalsyValues(obj) {
  if (typeof obj !== "object" || obj === null) return obj;

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object") {
      removeFalsyValues(obj[key]); // Recursively clean nested objects
    }
    if (!obj[key]) {
      delete obj[key];
    }
  });

  return obj;
}

document.addEventListener("click", (event) => {
  const targetId = event.target.id;

  if (targetId.endsWith("AddTable")) {
    const schemaId = targetId.replace("AddTable", "");
    addTable(schemaId);
  } else if (targetId.endsWith("AddAttribute")) {
    const tableId = targetId.replace("AddAttribute", "");
    addAttribute(tableId);
  } else if (targetId.endsWith("RemoveSchema")) {
    event.target.parentElement.remove();
  } else if (targetId.endsWith("RemoveTable")) {
    event.target.parentElement.remove();
  } else if (targetId.endsWith("Remove")) {
    event.target.parentElement.remove();
  }
});

function generateYAML() {
  const schemas = [];

  for (let i = 0; i < schemaCount; i++) {
    const schemaId = `schema${i}`;
    const schemaName = document.getElementById(`${schemaId}Name`).value;
    const tables = [];

    const tablesDiv = document.getElementById(`${schemaId}Tables`).children;
    for (let j = 0; j < tablesDiv.length; j++) {
      const tableId = `${schemaId}Table${j}`;
      const tableName = document.getElementById(`${tableId}Name`).value;
      const autoPrimaryKey = document.getElementById(
        `${tableId}AutoPrimaryKey`
      ).checked;
      const autoTimestamps = document.getElementById(
        `${tableId}AutoTimestamps`
      ).checked;

      const attributes = [];
      const attributesDiv = document.getElementById(
        `${tableId}Attributes`
      ).children;
      for (let k = 0; k < attributesDiv.length; k++) {
        const attrId = `${tableId}Attribute${k}`;
        attributes.push({
          name: document.getElementById(`${attrId}Name`).value,
          type: document.getElementById(`${attrId}Type`).value,
          options: {
            primary_key: document.getElementById(`${attrId}PrimaryKey`).checked,
            readonly: document.getElementById(`${attrId}Readonly`).checked,
            default: document.getElementById(`${attrId}DefaultValue`).value
              ? {
                  value: document.getElementById(`${attrId}DefaultValue`).value,
                }
              : undefined,
          },
          validation: {
            not_null: document.getElementById(`${attrId}NotNull`).checked,
            min: document.getElementById(`${attrId}Min`).value
              ? parseInt(document.getElementById(`${attrId}Min`).value)
              : undefined,
            max: document.getElementById(`${attrId}Max`).value
              ? parseInt(document.getElementById(`${attrId}Max`).value)
              : undefined,
          },
        });
      }

      tables.push({
        name: tableName,
        options: {
          auto_primary_key: autoPrimaryKey,
          auto_timestamps: autoTimestamps,
        },
        attributes: Object.fromEntries(
          attributes.map((attribute) => {
            let val = { ...attribute };
            removeFalsyValues(val);
            let name = val.name;
            delete val.name;
            return [name, val];
          })
        ),
      });
    }

    schemas.push({
      name: schemaName,
      tables: Object.fromEntries(
        tables.map((table) => {
          let val = { ...table };
          removeFalsyValues(val);
          let name = val.name;
          delete val.name;
          return [name, val];
        })
      ),
    });
  }

  const database = {
    schemas: Object.fromEntries(
      schemas.map((schema) => {
        let val = { ...schema };
        removeFalsyValues(val);
        let name = val.name;
        delete val.name;
        return [name, val];
      })
    ),
  };

  const input = document.getElementById("input");
  if (!input) {
    console.error("missing input");
    return;
  }
  input.value = YAML.stringify(database);
}

const YAML = {
  stringify: function (obj, indent = 0) {
    const yamlLines = [];
    const space = "  ".repeat(indent);
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        yamlLines.push(`${space}${key}:`);
        yamlLines.push(YAML.stringify(value, indent + 1));
      } else {
        yamlLines.push(`${space}${key}: ${value}`);
      }
    }
    return yamlLines.filter((e) => !!e.trim()).join("\n");
  },
};

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("addSchemaButton")
    .addEventListener("click", addSchema);
  document
    .getElementById("generateYAMLButton")
    .addEventListener("click", generateYAML);
});
