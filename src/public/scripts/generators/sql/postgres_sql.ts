import { alignKeyword, alignKeywords, replaceDoubleSpaces } from '../../core/formatting';
import { CodeGenerator, ATTRIBUTE_OPTION, SqlSchema, SqlTable, SqlTableAttribute, SqlType, Endpoint } from '../../core/structure';

const typeKeywords = Object.values(SqlType).map((e) => ` ${e}`);

export class SqlGenerator extends CodeGenerator {
        static JoinAnd(arr: string[]) {
                return arr.join(`${'\n    '}AND `);
        }

        CreateAttributeString(attr: SqlTableAttribute): string {
                let attrStr = `${attr.value} ${attr.fullSqlType}`;

                for (const option of attr.options) {
                        for (const key in ATTRIBUTE_OPTION) {
                                const regex = ATTRIBUTE_OPTION[key];
                                if (!regex.test(option)) {
                                        continue;
                                }
                                if (key === 'PRIMARY KEY') continue;
                                if (key === 'UNIQUE_GROUP') continue;
                                let toAdd = ` ${key}`;
                                if (attrStr.includes(toAdd)) continue;
                                attrStr += toAdd;
                        }
                }

                // if (attr.referenceTo) {
                //         attrStr += ` REFERENCES ${attr.referenceTo.schema.name}.${attr.referenceTo.table.label}(${attr.referenceTo.column.value})`;
                // }

                if (attr.defaultValue !== undefined) {
                        attrStr += ` DEFAULT ${attr.defaultValue}`;
                }
                return `    ${attrStr}`;
        }

        GenerateSqlEndpoint(table: SqlTable): string {
                if (!table.endpoints) {
                        return '';
                }

                let sqlEndpoint: string[] = [];

                sqlEndpoint.push(`\n\n-- crud operations for ${table.fullName}`);

                this.GenerateCreateEndpoint(table, sqlEndpoint);
                this.GenerateReadSingleEndpoint(table, sqlEndpoint);
                this.GenerateReadManyEndpoint(table, sqlEndpoint);
                this.GenerateUpdateEndpoint(table, sqlEndpoint);
                this.GenerateDeleteEndpoint(table, sqlEndpoint);

                return sqlEndpoint.join('\n\n');
        }

        private GenerateDeleteEndpoint(table: SqlTable, sqlEndpoint: string[]) {
                let code: string[] = [];

                const endpoint = table.endpoints!.delete.single;

                const primaryInputsEqualing = endpoint.sql.inputs.map(
                        (e) => `${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column} = ${e.sql.name}`
                );
                let where = SqlGenerator.JoinAnd(alignKeyword(primaryInputsEqualing, '='));

                where = `\n    ${where}`;

                const params = alignKeywords(
                        endpoint.sql.inputs.map((e) => `${e.sql.name} ${e.sql.type}`),
                        typeKeywords
                ).join(',\n    ');

                let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${endpoint.sql.name};
CREATE PROCEDURE ${table.parentSchema.name}.${endpoint.sql.name} (
    ${params}
) LANGUAGE plpgsql AS $$ BEGIN
DELETE FROM ${table.fullName}
WHERE ${where}; 
END; 
$$;`;
                code.push(procedure);

                sqlEndpoint.push(code.join('\n\n'));
        }

        private GenerateUpdateEndpoint(table: SqlTable, sqlEndpoint: string[]) {
                let code: string[] = [];

                const endpoint = table.endpoints!.update.single;
                const whereEquals = endpoint.sql.inputs.map(
                        (e) => `${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column} = ${e.sql.name}`
                );
                const whereEqualsAligned = alignKeyword(whereEquals, '=');
                let where = `\n    ${SqlGenerator.JoinAnd(whereEqualsAligned)}`;
                where = `\n    ${where}`;

                const params = alignKeywords(
                        endpoint.sql.inputs.map((e) => `${e.sql.name} ${e.sql.type}`),
                        typeKeywords
                ).join(',\n    ');

                let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${endpoint.sql.name};
CREATE PROCEDURE ${table.parentSchema.name}.${endpoint.sql.name} ( 
    ${params}
) LANGUAGE plpgsql AS $$ BEGIN
    UPDATE ${table.fullName} 
SET 
    ${alignKeyword(
            endpoint.sql.inputs.map((e) => `${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column} = ${e.sql.name}`),
            '='
    ).join(',\n    ')}
WHERE ${where};
END; 
$$;`;

                code.push(procedure);

                sqlEndpoint.push(code.join('\n\n'));
        }

        private GenerateReadSingleEndpoint(table: SqlTable, sqlEndpoint: string[]) {
                let code: string[] = [];

                const endpoint = table.endpoints!.read.single;

                const inputStr = alignKeywords(
                        endpoint.sql.inputs.map((e) => `${e.sql.name} ${e.sql.type}`),
                        typeKeywords
                ).join(',\n    ');

                let inputs = endpoint.sql.inputs.length ? `\n    ${inputStr}\n` : ``;

                const whereParts = endpoint.sql.inputs.map((e) => {
                        let answer = [];
                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        answer.push('=');
                        answer.push(e.sql.name);
                        answer = alignKeywords(answer, typeKeywords);

                        return answer.join(' ');
                });
                let where = SqlGenerator.JoinAnd(alignKeyword(whereParts, '='));
                where = `\n    WHERE ${where}`;

                if (!endpoint.sql.inputs.length) {
                        where = '';
                }

                let join = '';
                let tableName = '';
                tableName = `${table.fullName}`;

                const paramsNeeded = endpoint.sql.outputs.map((e) => {
                        let answer = [];

                        if (e.sql.sqlLocation.columnAliasedAs) {
                                if (e.sql.sqlLocation.tableAliasedAs) {
                                        answer.push(`${e.sql.sqlLocation.tableAliasedAs}_${e.sql.sqlLocation.columnAliasedAs}`);
                                } else {
                                        answer.push();
                                }
                        } else {
                                answer.push(e.sql.sqlLocation.column);
                        }

                        answer.push(e.sql.type);

                        return answer.join(' ');
                });
                const params = alignKeywords(paramsNeeded, typeKeywords).join(',\n    ');
                const selectsNeeded = endpoint.sql.outputs.map((e) => {
                        let answer = [];

                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        if (e.sql.sqlLocation.columnAliasedAs) {
                                answer.push(`AS ${e.sql.sqlLocation.tableAliasedAs}_${e.sql.sqlLocation.columnAliasedAs}`);
                        } else {
                                answer.push(e.sql.sqlLocation.columnAliasedAs);
                        }
                        return answer.join(' ');
                });
                const selecting = alignKeyword(selectsNeeded, ' AS ').join(',\n    ');
                let procedure = `DROP FUNCTION IF EXISTS ${table.parentSchema.name}.${endpoint.sql.name};
CREATE FUNCTION ${table.parentSchema.name}.${endpoint.sql.name} (${inputs}) RETURNS TABLE ( 
    ${params}        
) LANGUAGE plpgsql AS $$ BEGIN
RETURN QUERY
SELECT 
    ${selecting}     
FROM ${tableName}${join}${where};
END; 
$$;`;
                code.push(procedure);

                sqlEndpoint.push(code.join('\n\n'));
        }

        private GenerateReadManyEndpoint(table: SqlTable, sqlEndpoint: string[]) {
                let code: string[] = [];

                const endpoint = table.endpoints!.read.single;

                const inputStr = alignKeywords(
                        endpoint.sql.inputs.map((e) => `${e.sql.name} ${e.sql.type}`),
                        typeKeywords
                ).join(',\n    ');

                let inputs = endpoint.sql.inputs.length ? `\n    ${inputStr}\n` : ``;

                const whereParts = endpoint.sql.inputs.map((e) => {
                        let answer = [];
                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        answer.push('=');
                        answer.push(e.sql.name);
                        answer = alignKeywords(answer, typeKeywords);

                        return answer.join(' ');
                });
                let where = SqlGenerator.JoinAnd(alignKeyword(whereParts, '='));
                where = `\n    WHERE ${where}`;

                if (!endpoint.sql.inputs.length) {
                        where = '';
                }

                let join = '';
                let tableName = '';
                // let joinStr = `\n    ${SqlGenerator.GenerateReadLeftJoinString(table)}`;

                // if (endpoint.sql.name.includes('join')) {
                //         join = joinStr;
                //         tableName = `${table.fullName} ${table.label.slice(0, 3)}_0`;
                // } else {
                tableName = `${table.fullName}`;
                // }

                const paramsNeeded = endpoint.sql.outputs.map((e) => {
                        let answer = [];

                        if (e.sql.sqlLocation.columnAliasedAs) {
                                if (e.sql.sqlLocation.tableAliasedAs) {
                                        answer.push(`${e.sql.sqlLocation.tableAliasedAs}_${e.sql.sqlLocation.columnAliasedAs}`);
                                } else {
                                        answer.push();
                                }
                        } else {
                                answer.push(e.sql.sqlLocation.column);
                        }

                        answer.push(e.sql.type);

                        return answer.join(' ');
                });
                const params = alignKeywords(paramsNeeded, typeKeywords).join(',\n    ');
                const selectsNeeded = endpoint.sql.outputs.map((e) => {
                        let answer = [];

                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        if (e.sql.sqlLocation.columnAliasedAs) {
                                answer.push(`AS ${e.sql.sqlLocation.tableAliasedAs}_${e.sql.sqlLocation.columnAliasedAs}`);
                        } else {
                                answer.push(e.sql.sqlLocation.columnAliasedAs);
                        }
                        return answer.join(' ');
                });
                const selecting = alignKeyword(selectsNeeded, ' AS ').join(',\n    ');
                let procedure = `DROP FUNCTION IF EXISTS ${table.parentSchema.name}.${endpoint.sql.name};
CREATE FUNCTION ${table.parentSchema.name}.${endpoint.sql.name} (${inputs}) RETURNS TABLE ( 
    ${params}        
) LANGUAGE plpgsql AS $$ BEGIN
RETURN QUERY
SELECT 
    ${selecting}     
FROM ${tableName}${join}${where};
END; 
$$;`;
                code.push(procedure);

                sqlEndpoint.push(code.join('\n\n'));
        }

        private static GenerateReadLeftJoinString(table: SqlTable): string {
                const allJoinsNeeded = SqlTable.ReadJoins(table);
                if (!allJoinsNeeded || !Object.keys(table.foreignKeys()).length) {
                        return '';
                }

                const allJoinParts: string[] = [];

                for (const { left, right } of allJoinsNeeded) {
                        if (left.usingAttributes.length !== right.usingAttributes.length) {
                                console.error('mismatched joined attribute length!');
                                break;
                        }

                        const singleJoinParts: string[] = [];

                        left.usingAttributes.forEach((leftAttr, i) => {
                                const rightAttr = right.usingAttributes[i];
                                const condition = [`${right.alias}.${rightAttr.value}`, '=', `${left.alias}.${leftAttr.value}`];
                                const aJoin = i === 0 ? ['LEFT JOIN', right.table.fullName, right.alias, 'ON', ...condition] : ['AND', ...condition];

                                singleJoinParts.push(aJoin.join(' '));
                        });

                        allJoinParts.push(singleJoinParts.join(' '));
                }

                return alignKeyword(allJoinParts, ' ON ').join('\n    ');
        }

        private GenerateCreateEndpoint(table: SqlTable, sqlEndpoint: string[]) {
                let code: string[] = [];

                const endpoint = table.endpoints!.create.single;
                const paramsNeeded = endpoint.sql.inout
                        .map((e) => `INOUT ${e.sql.name} ${e.sql.type}`)
                        .concat(endpoint.sql.inputs.map((e) => `${e.sql.name} ${e.sql.type}`));
                const params = alignKeywords(paramsNeeded, typeKeywords).join(',\n    ');
                const into = endpoint.sql.inputs
                        .map((e) => `${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`)
                        .join(',\n    ');
                const values = endpoint.sql.inputs.map((e) => `${e.sql.name}`).join(',\n    ');
                const returning = endpoint.sql.outputs.map((e) => `${e.sql.sqlLocation.column}`) + ' INTO ' + endpoint.sql.outputs.map((e) => `${e.sql.name}`);

                let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${endpoint.sql.name};
CREATE PROCEDURE ${table.parentSchema.name}.${endpoint.sql.name} ( 
    ${params}
) LANGUAGE plpgsql AS $$ BEGIN
INSERT INTO ${table.fullName} (
    ${into}
) 
VALUES (
    ${values}
)
RETURNING 
    ${returning}; 
END; 
$$;`;

                code.push(procedure);

                sqlEndpoint.push(code.join('\n\n'));
        }

        ProcessSchema(schema: SqlSchema) {
                let tableSql = '';
                let endpointSql = '';

                let tables = schema.tables;

                // sql += `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
                // sql += `DROP SCHEMA ${schemaName};`

                for (const tableName in tables) {
                        if (!Object.prototype.hasOwnProperty.call(tables, tableName)) {
                                continue;
                        }
                        const table = tables[tableName];

                        const attrStrings: string[] = alignKeywords(
                                Object.values(table.attributes).map((e) => this.CreateAttributeString(e)),
                                typeKeywords
                        );

                        const pks: string[] = Object.values(table.primaryKeys()).map((e) => e.value);
                        const allGroupKeysStrings: string[][] = generateGroupKeyStrings(table);

                        let createTableBody: string[] = [...attrStrings];

                        const groupsStr = allGroupKeysStrings.map((e) => `    UNIQUE (${e.join(', ')})`);
                        if (groupsStr.length > 0) {
                                createTableBody.push(`${groupsStr.join(',\n')}`);
                        }

                        if (pks.length > 0) {
                                createTableBody.push(`    PRIMARY KEY ( ${pks.join(', ')} )`);
                        }

                        let fkGroupings = [...table.uniqueFkGroups().entries()];
                        for (const [fkTable, fkAttrs] of fkGroupings) {
                                createTableBody.push(
                                        `    FOREIGN KEY ( ${fkAttrs.map((e) => e.value).join(', ')} ) REFERENCES ${fkTable.fullName} ( ${fkAttrs
                                                .map((e) => e.referenceTo?.column.value || '!ERROR!')
                                                .join(', ')} )`
                                );
                        }

                        const dropCreate = `DROP TABLE IF EXISTS ${table.fullName};\nCREATE TABLE ${table.fullName} (\n`;
                        const createTableEnd = ['\n);'];

                        let createTable = dropCreate + createTableBody.join(',\n') + createTableEnd.join(',\n');

                        const fks = Object.values(table.foreignKeys());
                        for (const fk of fks) {
                                createTable += `\nCREATE INDEX idx_${fk.value} ON ${fk.parentTable.fullName}(${fk.value});`;
                        }

                        tableSql += `${createTable}\n`;

                        endpointSql += this.GenerateSqlEndpoint(table);
                }

                if (endpointSql) {
                        endpointSql = endpointSql.replace(/SERIAL/g, 'INT');
                }

                function generateGroupKeyStrings(table: SqlTable) {
                        let allGroupKeysStrings: string[][] = [];
                        let groupedKeys = table.uniqueGroups();
                        for (const key in groupedKeys) {
                                const grouping = groupedKeys[key];
                                let groupKeysStrings: string[] = [];
                                // for each group
                                for (let m = 0; m < grouping.length; m++) {
                                        const attribute = grouping[m];
                                        // the attr of that group
                                        groupKeysStrings.push(`${attribute.value}`);
                                }
                                if (groupKeysStrings.length > 0) {
                                        allGroupKeysStrings.push(groupKeysStrings);
                                }
                        }
                        return allGroupKeysStrings;
                }

                endpointSql = endpointSql.trim();
                tableSql = tableSql.trim();

                return {
                        endpointSql,
                        tableSql,
                };
        }

        GenerateDrops(sql: string) {
                let procFnTables = [];
                let procFnSchemas = [];
                let procFnDrops = [];
                let everythingElse = [];

                let lines = sql.split('\n');
                for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.startsWith('DROP TABLE')) {
                                procFnTables.push(line);
                        } else if (line.startsWith('DROP PROCEDURE') || line.startsWith('DROP FUNCTION')) {
                                procFnDrops.push(line);
                        } else if (line.startsWith('DROP SCHEMA')) {
                                procFnSchemas.push(line);
                        } else {
                                everythingElse.push(line);
                        }
                }

                const alignOn = 'IF EXISTS';

                let drops = [
                        alignKeyword(procFnDrops, alignOn).join('\n'),
                        alignKeyword(procFnTables, alignOn).join('\n'),
                        alignKeyword(procFnSchemas, alignOn).join('\n'),
                ];
                return { drops, everythingElse };
        }

        Run() {
                let schemas = this.input;
                let tableStrings: string[] = [];
                let endpointStrings: string[] = [];
                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];
                        let schemaSql = this.ProcessSchema(schema);
                        tableStrings.push(schemaSql.tableSql);
                        endpointStrings.push(schemaSql.endpointSql);
                }

                this.output = {};

                {
                        let { drops, everythingElse } = this.GenerateDrops(tableStrings.join('\n\n'));
                        if (everythingElse.length > 0) {
                                this.output['create.table.sql'] = everythingElse.join('\n');
                        }
                        if (drops.length > 0) {
                                this.output['drop.table.sql'] = drops.join('\n');
                        }
                }
                {
                        let { drops, everythingElse } = this.GenerateDrops(endpointStrings.join('\n\n'));
                        if (everythingElse.length > 0) {
                                this.output['create.logic.sql'] = everythingElse.join('\n');
                        }
                        if (drops.length > 0) {
                                this.output['drop.logic.sql'] = drops.join('\n');
                        }
                }

                return this;
        }

        static GenerateACreateEndpoint(endpoint: Endpoint, withPlaceholders: boolean = false) {
                const into = endpoint.sql.inputs.map((e) => `${e.sql.sqlLocation.column}`).join(',\n    ');
                let defaultCount = 0;
                const values = endpoint.sql.inputs.map((e, i) => (withPlaceholders ? `$${i + 1 - defaultCount}` : `${e.sql.name}`)).join(',\n    ');
                const returning = endpoint.sql.outputs.map((e) => `${e.sql.sqlLocation.column}`).join(', ');

                let procedure = `
INSERT INTO ${endpoint.tableFullName} (
    ${into}
) 
VALUES (
    ${values}
)
RETURNING 
    ${returning};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateADeleteEndpoint(endpoint: Endpoint, withPlaceholders: boolean = false) {
                let where = SqlGenerator.JoinAnd(
                        alignKeyword(
                                endpoint.sql.inputs.map(
                                        (e, i) =>
                                                `${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column} = ${
                                                        withPlaceholders ? `$${i + 1}` : e.sql.name
                                                }`
                                ),
                                '='
                        )
                );

                where = `\n    ${where}`;

                let procedure = `DELETE FROM ${endpoint.tableFullName}
WHERE ${where};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateAUpdateEndpoint(endpoint: Endpoint, withPlaceholders: boolean = false) {
                const whereEquals = endpoint.sql.inout.map((e, i) => `${e.sql.sqlLocation.column} = ${withPlaceholders ? `$${i + 1}` : e.sql.name}`);
                let whereClauses = whereEquals.length + 1;
                let setting = endpoint.sql.inputs.map((e, i) => `${e.sql.sqlLocation.column} = ${withPlaceholders ? `$${whereClauses + i}` : e.sql.name}`);

                const whereEqualsAligned = alignKeyword(whereEquals, '=');
                let where = `\n    ${SqlGenerator.JoinAnd(whereEqualsAligned)}`;
                where = `\n    ${where}`;

                console.log('endpoint.sql.inputs :>> ', endpoint.sql.inputs);
                let procedure = `SET 
    ${alignKeyword(setting, '=').join(',\n    ')}
WHERE ${where};`;

                let start = `UPDATE ${endpoint.tableFullName} `;
                return start + replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateAReadEndpoint(endpoint: Endpoint, table: SqlTable, withPlaceholders: boolean = false) {
                const whereParts = endpoint.sql.inputs.map((e, i) => {
                        let answer = [];
                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        answer.push('=');
                        answer.push(withPlaceholders ? `$${i + 1}` : e.sql.name);
                        answer = alignKeywords(answer, typeKeywords);

                        return answer.join(' ');
                });
                let where = SqlGenerator.JoinAnd(alignKeyword(whereParts, '='));
                where = `\n    WHERE ${where}`;

                let orderBy = '';

                if (!endpoint.sql.inputs.length) {
                        // assuming its a many at this point
                        // where = '';

                        let manyLimitOffset = ` LIMIT $1 OFFSET $2`;
                        where = manyLimitOffset;
                        orderBy = `ORDER BY ${endpoint.go.primaryKey.sql.sqlLocation.table}.${endpoint.go.primaryKey.sql.sqlLocation.column}`;
                }

                let join = '';
                let tableName = '';
                let joinStr = `\n    ${SqlGenerator.GenerateReadLeftJoinString(table)}`;

                if (endpoint.sql.name.includes('join')) {
                        join = joinStr;
                        tableName = `${endpoint.tableFullName} ${endpoint.tableFullName.slice(0, 3)}_0`;
                } else {
                        tableName = `${endpoint.tableFullName}`;
                }

                const selectsNeeded = endpoint.sql.outputs.map((e) => {
                        let answer = [];

                        if (e.sql.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sql.sqlLocation.tableAliasedAs}.${e.sql.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sql.sqlLocation.schema}.${e.sql.sqlLocation.table}.${e.sql.sqlLocation.column}`);
                        }
                        if (e.sql.sqlLocation.columnAliasedAs) {
                                answer.push(`AS ${e.sql.sqlLocation.tableAliasedAs}_${e.sql.sqlLocation.columnAliasedAs}`);
                        } else {
                                answer.push(e.sql.sqlLocation.columnAliasedAs);
                        }
                        return answer.join(' ');
                });
                const selecting = alignKeyword(selectsNeeded, ' AS ').join(',\n    ');

                let afterFrom = [tableName, join, orderBy, where];
                let procedure = `SELECT 
    ${selecting}     
FROM ${afterFrom.join('\n')};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }
}
