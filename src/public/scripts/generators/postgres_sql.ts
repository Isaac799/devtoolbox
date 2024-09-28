import { alignKeyword, alignKeywords, replaceDoubleSpaces } from '../core/formatting';
import { CodeGenerator, ATTRIBUTE_OPTION, SqlSchema, SqlTable, SqlTableAttribute, Types, CodeLogic } from '../core/structure';

const typeKeywords = Object.values(Types).map((e) => ` ${e}`);

export class SqlGenerator extends CodeGenerator {
        static JoinAnd(arr: string[]) {
                return arr.join(`${'\n    '}AND `);
        }

        CreateAttributeString(attr: SqlTableAttribute): string {
                let attrStr = `${attr.value} ${attr.sqlType}`;

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

        GenerateSqlLogic(table: SqlTable): string {
                let sqlLogic: string[] = [];

                if (!table.logic.create && !table.logic.read && !table.logic.update && !table.logic.delete) {
                        return '';
                }

                sqlLogic.push(`\n\n-- crud operations for ${table.fullName}`);

                this.GenerateCreateLogic(table, sqlLogic);
                this.GenerateReadLogic(table, sqlLogic);
                this.GenerateUpdateLogic(table, sqlLogic);
                this.GenerateDeleteLogic(table, sqlLogic);

                return sqlLogic.join('\n\n');
        }

        private GenerateDeleteLogic(table: SqlTable, sqlLogic: string[]) {
                if (!table.logic.delete) {
                        return;
                }
                let code: string[] = [];

                for (let i = 0; i < table.logic.delete.length; i++) {
                        const logic = table.logic.delete[i];

                        let where = SqlGenerator.JoinAnd(
                                alignKeyword(
                                        logic.inputs
                                                .filter((e) => e.primary)
                                                .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.sql.name}`),
                                        '='
                                )
                        );

                        where = `\n    ${where}`;

                        const params = alignKeywords(
                                logic.inputs.filter((e) => e.primary).map((e) => `${e.sql.name} ${e.sql.type}`),
                                typeKeywords
                        ).join(',\n    ');

                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} (
    ${params}
) LANGUAGE plpgsql AS $$ BEGIN
DELETE FROM ${table.fullName}
WHERE ${where}; 
END; 
$$;`;
                        code.push(procedure);
                }

                sqlLogic.push(code.join('\n\n'));
        }

        private GenerateUpdateLogic(table: SqlTable, sqlLogic: string[]) {
                if (!table.logic.update) {
                        return;
                }
                let code: string[] = [];

                for (let i = 0; i < table.logic.update.length; i++) {
                        const logic = table.logic.update[i];
                        const whereEquals = logic.inputs
                                .filter((e) => e.primary)
                                .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.sql.name}`);
                        const whereEqualsAligned = alignKeyword(whereEquals, '=');
                        let where = `\n    ${SqlGenerator.JoinAnd(whereEqualsAligned)}`;
                        where = `\n    ${where}`;

                        const params = alignKeywords(
                                logic.inputs.map((e) => `${e.sql.name} ${e.sql.type}`),
                                typeKeywords
                        ).join(',\n    ');

                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} ( 
    ${params}
) LANGUAGE plpgsql AS $$ BEGIN
    UPDATE ${table.fullName} 
SET 
    ${alignKeyword(
            logic.inputs.map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.sql.name}`),
            '='
    ).join(',\n    ')}
WHERE ${where};
END; 
$$;`;

                        code.push(procedure);
                }

                sqlLogic.push(code.join('\n\n'));
        }

        private GenerateReadLogic(table: SqlTable, sqlLogic: string[]) {
                if (!table.logic.read) {
                        return;
                }
                let code: string[] = [];

                for (let i = 0; i < table.logic.read.length; i++) {
                        const logic = table.logic.read[i];

                        let inputs = logic.inputs.length
                                ? `\n    ${alignKeywords(
                                          logic.inputs.filter((e) => e.primary).map((e) => `${e.sql.name} ${e.sql.type}`),
                                          typeKeywords
                                  ).join(',\n    ')}\n`
                                : ``;

                        const whereParts = logic.inputs.map((e) => {
                                let answer = [];
                                if (e.sqlLocation.tableAliasedAs) {
                                        answer.push(`${e.sqlLocation.tableAliasedAs}.${e.sqlLocation.column}`);
                                } else {
                                        answer.push(`${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`);
                                }
                                answer.push('=');
                                answer.push(e.sql.name);
                                answer = alignKeywords(answer, typeKeywords);

                                return answer.join(' ');
                        });
                        let where = SqlGenerator.JoinAnd(alignKeyword(whereParts, '='));
                        where = `\n    WHERE ${where}`;

                        if (!logic.inputs.length) {
                                where = '';
                        }

                        let join = '';
                        let tableName = '';
                        let joinStr = `\n    ${SqlGenerator.GenerateReadLeftJoinString(table)}`;

                        if (logic.name.includes('join')) {
                                join = joinStr;
                                tableName = `${table.fullName} ${table.label.slice(0, 3)}_0`;
                        } else {
                                tableName = `${table.fullName}`;
                        }

                        const paramsNeeded = logic.outputs.map((e) => {
                                let answer = [];

                                if (e.sqlLocation.columnAliasedAs) {
                                        if (e.sqlLocation.tableAliasedAs) {
                                                answer.push(`${e.sqlLocation.tableAliasedAs}_${e.sqlLocation.columnAliasedAs}`);
                                        } else {
                                                answer.push();
                                        }
                                } else {
                                        answer.push(e.sqlLocation.column);
                                }

                                answer.push(e.sql.type);

                                return answer.join(' ');
                        });
                        const params = alignKeywords(paramsNeeded, typeKeywords).join(',\n    ');
                        const selectsNeeded = logic.outputs.map((e) => {
                                let answer = [];

                                if (e.sqlLocation.tableAliasedAs) {
                                        answer.push(`${e.sqlLocation.tableAliasedAs}.${e.sqlLocation.column}`);
                                } else {
                                        answer.push(`${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`);
                                }
                                if (e.sqlLocation.columnAliasedAs) {
                                        answer.push(`AS ${e.sqlLocation.tableAliasedAs}_${e.sqlLocation.columnAliasedAs}`);
                                } else {
                                        answer.push(e.sqlLocation.columnAliasedAs);
                                }
                                return answer.join(' ');
                        });
                        const selecting = alignKeyword(selectsNeeded, ' AS ').join(',\n    ');
                        let procedure = `DROP FUNCTION IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE FUNCTION ${table.parentSchema.name}.${logic.name} (${inputs}) RETURNS TABLE ( 
    ${params}        
) LANGUAGE plpgsql AS $$ BEGIN
RETURN QUERY
SELECT 
    ${selecting}     
FROM ${tableName}${join}${where};
END; 
$$;`;
                        code.push(procedure);
                }

                sqlLogic.push(code.join('\n\n'));
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

        private GenerateCreateLogic(table: SqlTable, sqlLogic: string[]) {
                if (!table.logic.create) {
                        return;
                }
                let code: string[] = [];

                for (let i = 0; i < table.logic.create.length; i++) {
                        const logic = table.logic.create[i];
                        const paramsNeeded = logic.inputs
                                .filter((e) => e.primary)
                                .map((e) => `INOUT ${e.sql.name} ${e.sql.type}`)
                                .concat(logic.inputs.filter((e) => !e.primary).map((e) => `${e.sql.name} ${e.sql.type}`));
                        const params = alignKeywords(paramsNeeded, typeKeywords).join(',\n    ');
                        const into = logic.inputs
                                .filter((e) => !e.primary)
                                .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`)
                                .join(',\n    ');
                        const values = logic.inputs
                                .filter((e) => !e.primary)
                                .map((e) => `${e.sql.name}`)
                                .join(',\n    ');
                        const returning = logic.outputs.map((e) => `${e.sqlLocation.column}`) + ' INTO ' + logic.outputs.map((e) => `${e.sql.name}`);

                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} ( 
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
                }

                sqlLogic.push(code.join('\n\n'));
        }

        ProcessSchema(schema: SqlSchema) {
                let tableSql = '';
                let logicSql = '';

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
                        const createTableEnd = '\n);';
                        const createTable = dropCreate + createTableBody.join(',\n') + createTableEnd;

                        tableSql += `${createTable}\n`;

                        logicSql += this.GenerateSqlLogic(table);
                }

                if (logicSql) {
                        logicSql = logicSql.replace(/SERIAL/g, 'INT');
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

                logicSql = logicSql.trim();
                tableSql = tableSql.trim();

                return {
                        logicSql,
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
                                console.log('HI');

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
                let logicStrings: string[] = [];
                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];
                        let schemaSql = this.ProcessSchema(schema);
                        tableStrings.push(schemaSql.tableSql);
                        logicStrings.push(schemaSql.logicSql);
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
                        let { drops, everythingElse } = this.GenerateDrops(logicStrings.join('\n\n'));
                        if (everythingElse.length > 0) {
                                this.output['create.logic.sql'] = everythingElse.join('\n');
                        }
                        if (drops.length > 0) {
                                this.output['drop.logic.sql'] = drops.join('\n');
                        }
                }

                return this;
        }

        static GenerateACreateLogic(logic: CodeLogic, withPlaceholders: boolean = false) {
                const into = logic.inputs
                        .filter((e) => !e.primary)
                        .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`)
                        .join(',\n    ');
                const values = logic.inputs
                        .filter((e) => !e.primary)
                        .map((e, i) => (withPlaceholders ? `$${i + 1}` : `${e.sql.name}`))
                        .join(',\n    ');
                const returning = logic.outputs.map((e) => `${e.sqlLocation.column}`) + ' INTO ' + logic.outputs.map((e) => `${e.sql.name}`);

                let procedure = `
INSERT INTO ${logic.sqlTableName} (
    ${into}
) 
VALUES (
    ${values}
)
RETURNING 
    ${returning};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateADeleteLogic(logic: CodeLogic, withPlaceholders: boolean = false) {
                let where = SqlGenerator.JoinAnd(
                        alignKeyword(
                                logic.inputs
                                        .filter((e) => e.primary)
                                        .map(
                                                (e, i) =>
                                                        `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${
                                                                withPlaceholders ? `$${i + 1}` : e.sql.name
                                                        }`
                                        ),
                                '='
                        )
                );

                where = `\n    ${where}`;

                let procedure = `DELETE FROM ${logic.sqlTableName}
WHERE ${where};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateAUpdateLogic(logic: CodeLogic, withPlaceholders: boolean = false) {
                const whereEquals = logic.inputs
                        .filter((e) => e.primary)
                        .map(
                                (e, i) =>
                                        `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${
                                                withPlaceholders ? `$${i + 1}` : e.sql.name
                                        }`
                        );
                let whereClauses = whereEquals.length + 1;

                const whereEqualsAligned = alignKeyword(whereEquals, '=');
                let where = `\n    ${SqlGenerator.JoinAnd(whereEqualsAligned)}`;
                where = `\n    ${where}`;

                let procedure = `SET 
    ${alignKeyword(
            logic.inputs
                    .filter((e) => !e.primary)
                    .map(
                            (e, i) =>
                                    `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${
                                            withPlaceholders ? `$${whereClauses + i}` : e.sql.name
                                    }`
                    ),
            '='
    ).join(',\n    ')}
WHERE ${where};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }

        static GenerateAReadLogic(logic: CodeLogic, table: SqlTable, withPlaceholders: boolean = false) {
                const whereParts = logic.inputs.map((e, i) => {
                        let answer = [];
                        if (e.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sqlLocation.tableAliasedAs}.${e.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`);
                        }
                        answer.push('=');
                        answer.push(withPlaceholders ? `$${i + 1}` : e.sql.name);
                        answer = alignKeywords(answer, typeKeywords);

                        return answer.join(' ');
                });
                let where = SqlGenerator.JoinAnd(alignKeyword(whereParts, '='));
                where = `\n    WHERE ${where}`;

                if (!logic.inputs.length) {
                        where = '';
                }

                let join = '';
                let tableName = '';
                let joinStr = `\n    ${SqlGenerator.GenerateReadLeftJoinString(table)}`;

                if (logic.name.includes('join')) {
                        join = joinStr;
                        tableName = `${logic.sqlTableName} ${logic.sqlTableName.slice(0, 3)}_0`;
                } else {
                        tableName = `${logic.sqlTableName}`;
                }

                const selectsNeeded = logic.outputs.map((e) => {
                        let answer = [];

                        if (e.sqlLocation.tableAliasedAs) {
                                answer.push(`${e.sqlLocation.tableAliasedAs}.${e.sqlLocation.column}`);
                        } else {
                                answer.push(`${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`);
                        }
                        if (e.sqlLocation.columnAliasedAs) {
                                answer.push(`AS ${e.sqlLocation.tableAliasedAs}_${e.sqlLocation.columnAliasedAs}`);
                        } else {
                                answer.push(e.sqlLocation.columnAliasedAs);
                        }
                        return answer.join(' ');
                });
                const selecting = alignKeyword(selectsNeeded, ' AS ').join(',\n    ');
                let procedure = `SELECT 
    ${selecting}     
FROM ${tableName}${join}${where};`;
                return replaceDoubleSpaces(procedure.replace(/\n/g, ' ').trim());
        }
}
