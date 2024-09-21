import { alignKeyword, alignKeywords } from '../core/formatting';
import { CodeGenerator, ATTRIBUTE_OPTION, SqlSchema, SqlTable, SqlTableAttribute, Types } from '../core/structure';

const typeKeywords = Object.values(Types).map((e) => ` ${e}`);

export class SqlGenerator extends CodeGenerator {
        JoinAnd(arr: string[]) {
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
                return attrStr;
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

                        let where = this.JoinAnd(
                                alignKeyword(
                                        logic.inputs
                                                .filter((e) => e.primary)
                                                .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.name}`),
                                        '='
                                )
                        );

                        where = `\n    ${where}`;

                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} (
    ${alignKeywords(
            logic.inputs.filter((e) => e.primary).map((e) => `${e.name} ${e.type}`),
            typeKeywords
    ).join(',\n    ')}
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
                        let where = this.JoinAnd(
                                alignKeyword(
                                        logic.inputs
                                                .filter((e) => e.primary)
                                                .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.name}`),
                                        '='
                                )
                        );
                        where = `\n    ${where}`;
                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} ( 
    ${alignKeywords(
            logic.inputs.map((e) => `${e.name} ${e.type}`),
            typeKeywords
    ).join(',\n    ')}
) LANGUAGE plpgsql AS $$ BEGIN
    UPDATE ${table.fullName} 
SET 
    ${alignKeyword(
            logic.inputs.map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column} = ${e.name}`),
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
                                          logic.inputs.filter((e) => e.primary).map((e) => `${e.name} ${e.type}`),
                                          typeKeywords
                                  ).join(',\n    ')}\n`
                                : ``;

                        let where = this.JoinAnd(
                                alignKeyword(
                                        logic.inputs.map((e) => {
                                                let answer = [];
                                                if (e.sqlLocation.tableAliasedAs) {
                                                        answer.push(`${e.sqlLocation.tableAliasedAs}.${e.sqlLocation.column}`);
                                                } else {
                                                        answer.push(`${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`);
                                                }
                                                answer.push('=');
                                                answer.push(e.name);
                                                answer = alignKeywords(answer, typeKeywords);

                                                return answer.join(' ');
                                        }),
                                        '='
                                )
                        );
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

                        let procedure = `DROP FUNCTION IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE FUNCTION ${table.parentSchema.name}.${logic.name} (${inputs}) RETURNS TABLE ( 
    ${alignKeywords(
            logic.outputs.map((e) => {
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

                    answer.push(e.type);

                    return answer.join(' ');
            }),
            typeKeywords
    ).join(',\n    ')}        
) LANGUAGE plpgsql AS $$ BEGIN
RETURN QUERY
SELECT 
    ${alignKeyword(
            logic.outputs.map((e) => {
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
            }),
            ' AS '
    ).join(',\n    ')}     
FROM ${tableName}${join}${where};
END; 
$$;`;
                        code.push(procedure);
                }

                sqlLogic.push(code.join('\n\n'));
        }

        private static GenerateReadLeftJoinString(table: SqlTable): string {
                let allJoinsNeeded = SqlTable.ReadJoins(table);
                if (!allJoinsNeeded) {
                        return '';
                }

                if (!Object.keys(table.foreignKeys()).length) {
                        return '';
                }

                let all: string[] = [];

                // console.log('allJoinsNeeded :>> ', allJoinsNeeded);

                for (const leftRightInfo of allJoinsNeeded) {
                        const left = leftRightInfo.left;
                        const right = leftRightInfo.right;

                        let parts = [];

                        if (left.usingAttributes.length !== right.usingAttributes.length) {
                                console.error('mismatched joined attribute length!');
                                break;
                        }

                        for (let i = 0; i < left.usingAttributes.length; i++) {
                                const leftAttr = left.usingAttributes[i];
                                const rightAttr = right.usingAttributes[i];

                                let attrEqualsAttr = [
                                        // t1Attr.fullName,
                                        // '=',
                                        // `${table1.tableAlias}.${t2Attr.value}`,
                                ];
                                let attrEqualsAttr2 = [`${right.alias}.${rightAttr.value}`, '=', `${left.alias}.${leftAttr.value}`];
                                if (i === 0) {
                                        attrEqualsAttr = ['LEFT JOIN', right.table.fullName, right.alias, 'ON', ...attrEqualsAttr2];
                                } else {
                                        attrEqualsAttr = ['AND', ...attrEqualsAttr2];
                                }

                                let str = attrEqualsAttr.join(' ');

                                parts.push(str);
                        }

                        // console.log('parts :>> ', parts);
                        all.push(parts.join(' '));
                        // all = all.concat(parts);
                }

                all = alignKeyword(all, ' ON ');

                return all.join('\n    ');
        }

        private GenerateCreateLogic(table: SqlTable, sqlLogic: string[]) {
                if (!table.logic.create) {
                        return;
                }
                let code: string[] = [];

                for (let i = 0; i < table.logic.create.length; i++) {
                        const logic = table.logic.create[i];
                        let procedure = `DROP PROCEDURE IF EXISTS ${table.parentSchema.name}.${logic.name};
CREATE PROCEDURE ${table.parentSchema.name}.${logic.name} ( 
    ${alignKeywords(
            logic.inputs
                    .filter((e) => e.primary)
                    .map((e) => `INOUT ${e.name} ${e.type}`)
                    .concat(logic.inputs.filter((e) => !e.primary).map((e) => `${e.name} ${e.type}`)),
            typeKeywords
    ).join(',\n    ')}
) LANGUAGE plpgsql AS $$ BEGIN
INSERT INTO ${table.fullName} (
    ${logic.inputs
            .filter((e) => !e.primary)
            .map((e) => `${e.sqlLocation.schema}.${e.sqlLocation.table}.${e.sqlLocation.column}`)
            .join(',\n    ')}
) 
VALUES (
    ${logic.inputs
            .filter((e) => !e.primary)
            .map((e) => `${e.name}`)
            .join(',\n    ')}
)
RETURNING 
    ${logic.outputs.map((e) => `${e.sqlLocation.column}`) + ' INTO ' + logic.outputs.map((e) => `${e.name}`)}; 
END; 
$$;`;

                        code.push(procedure);
                }

                sqlLogic.push(code.join('\n\n'));
        }

        ProcessSchema(schema: SqlSchema) {
                let sql = '';
                let sqlLogic = '';

                let tables = schema.tables;

                // sql += `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
                // sql += `DROP SCHEMA ${schemaName};`

                for (const tableName in tables) {
                        if (!Object.prototype.hasOwnProperty.call(tables, tableName)) {
                                continue;
                        }
                        const table = tables[tableName];

                        let attrStrings: string[] = Object.values(table.attributes).map((e) => this.CreateAttributeString(e));

                        attrStrings = alignKeywords(attrStrings, typeKeywords);

                        let pks: string[] = Object.values(table.primaryKeys()).map((e) => e.value);

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
                        let groupsStr = allGroupKeysStrings.map((e) => `    UNIQUE (${e.join(', ')})`);

                        let chunk = `DROP TABLE IF EXISTS ${table.fullName};                         
CREATE TABLE ${table.fullName} (
    ${attrStrings.join(',\n    ')}`;

                        let lowerChuck: string[] = [];
                        if (groupsStr.length > 0) {
                                lowerChuck.push(`${groupsStr.join(',\n')}`);
                        }

                        if (pks.length > 0) {
                                lowerChuck.push(`    PRIMARY KEY ( ${pks.join(', ')} )`);
                        }

                        let fkGroupings = [...table.uniqueFkGroups().entries()];
                        for (let i = 0; i < fkGroupings.length; i++) {
                                const fkGroup = fkGroupings[i];
                                const fkAttrs = fkGroup[1];
                                const fkTable = fkGroup[0];
                                lowerChuck.push(
                                        `    FOREIGN KEY ( ${fkAttrs.map((e) => e.value).join(', ')} ) REFERENCES ${fkTable.fullName} ( ${fkAttrs
                                                .map((e) => e.referenceTo?.column.value || '!ERROR!')
                                                .join(', ')} )`
                                );
                        }

                        chunk = [chunk, lowerChuck.join(`,\n`)].join(`,\n`);
                        chunk += '\n);';

                        sqlLogic += this.GenerateSqlLogic(table);

                        sql += `${chunk}\n`;
                }

                if (sqlLogic) {
                        sqlLogic = sqlLogic.replace(/SERIAL/g, 'INT');
                        sql = `${sql}${sqlLogic}`;
                }

                sql = sql.trim();

                if (!sql) {
                        this.output = '-- Nothing to show here';
                }

                return sql;
        }

        Run() {
                let schemas = this.input;
                let schemaStrings: string[] = [];

                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];
                        schemaStrings.push(`--  -  -  -  ${schema.name} schema  -  -  -  --`);
                        schemaStrings.push(`DROP SCHEMA IF EXISTS ${schema.name};`);
                        schemaStrings.push(this.ProcessSchema(schema));
                }

                let tableNames = [];
                let schemaNames = [];
                for (const schema of Object.values(schemas)) {
                        schemaNames.push(schema.name);
                        for (const table of Object.values(schema.tables)) {
                                tableNames.push(table.fullName);
                        }
                }

                this.output = schemaStrings.join('\n\n');

                let procFnTables = [];
                let procFnSchemas = [];
                let procFnDrops = [];
                let other = [];

                let lines = this.output.split('\n');
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
                                other.push(line);
                        }
                }

                let drops = [procFnDrops.join('\n'), procFnTables.join('\n'), procFnSchemas.join('\n')];

                if (tableNames.length > 0) {
                        this.output = `${drops.join('\n')}
                        
${other.join('\n')}`;
                }

                return this;
        }
}
