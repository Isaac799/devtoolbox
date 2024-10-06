import {
        MAX_LOOP_COUNT,
        ATTRIBUTE_OPTION,
        SQL_TABLE_ATTRIBUTES,
        TokenizingState,
        SqlReferenceTo,
        SqlSchema,
        SqlTable,
        SqlTableAttribute,
        STATE_CHANGE_TRIGGERS,
        SqlType,
        UNALIASED_SELF_REFERENCE_ALIAS,
        EndpointParam,
        RangeResult,
        AttrValidation,
} from './structure';

/**
 * Tokenize text input. Result is used for all other features.
 */
export class InputParser {
        input: string = '';
        output: {
                [x: string]: SqlSchema;
        } = {};
        errorMessages: Array<string> = [];

        SaveErrorMessage(errorMessage: string) {
                this.errorMessages.push(errorMessage);
        }

        constructor() {}

        SetInput(value: string) {
                this.input = value;
                return this;
        }

        Read() {
                return this.output;
        }

        Clear() {
                this.input = '';
                this.output = {};
                this.errorMessages = [];
                return this;
        }

        /**
         *
         * @param {Array.<string>} lines
         * @returns {Array.<SqlSchema>}
         */
        ProcessLines(lines: Array<string>): {
                [x: string]: SqlSchema;
        } {
                let state = TokenizingState.None;
                let loopCount: number = 0;
                let schemas: {
                        [x: string]: SqlSchema;
                } = {
                        public: new SqlSchema('public'),
                };

                searchingLines: while (lines.length > 0) {
                        loopCount += 1;
                        if (loopCount > MAX_LOOP_COUNT) {
                                let message = `Maximum loop count (${MAX_LOOP_COUNT}) exceeded!`;
                                console.error(message);
                                this.SaveErrorMessage(message);
                                return {};
                        }

                        // As we look down the lines our last table is the one we are working on...
                        let schemaList = Object.values(schemas);
                        let schema = schemaList[schemaList.length - 1];
                        let tables = schema.tables;

                        let tableList = Object.values(tables);
                        let table = tableList[tableList.length - 1];

                        /**
                         * @type {string}
                         */
                        const line: string = lines.shift()!;
                        // console.warn('line', line);

                        switch (state) {
                                case TokenizingState.Attribute:
                                        let attributes = this.CreateAttributes(line, schemas, table);

                                        if (!attributes || attributes.length === 0) {
                                                state = TokenizingState.None;
                                                lines.unshift(line);
                                                continue searchingLines;
                                        }

                                        for (let m = 0; m < attributes.length; m++) {
                                                const attribute = attributes[m];

                                                let validAttribute = this.ValidAttribute(attribute, table);

                                                if (!validAttribute) {
                                                        // we don't need to reset the state
                                                        continue searchingLines;
                                                }

                                                table.attributes[attribute.value] = attribute;
                                        }

                                        let temp = [];
                                        for (const e of Object.values(table.attributes)) {
                                                temp.push(new EndpointParam(e, e.validation));
                                        }
                                        table.is = temp;

                                        break;
                                case TokenizingState.Schema:
                                        let newSchema = this.ParseSqlSchema(line);
                                        schemas[newSchema.name] = newSchema;
                                        state = TokenizingState.None;
                                        break;
                                case TokenizingState.Table:
                                        let newTable = this.ParseSqlTable(schema, line);

                                        if (!this.ValidTable(newTable, tables)) {
                                                // we don't need to reset the state
                                                state = TokenizingState.None;
                                                continue searchingLines;
                                        }

                                        let schemaList = Object.values(schemas);
                                        newTable.parentSchema = schemaList[schemaList.length - 1];

                                        tables[newTable.label] = newTable;
                                        state = TokenizingState.Attribute;
                                        break;
                                case TokenizingState.None:
                                        let nextState = this.DetermineNextState(line);
                                        if (nextState === TokenizingState.None) {
                                                continue searchingLines;
                                        }
                                        state = nextState;
                                        lines.unshift(line);
                                        continue searchingLines;
                                default:
                                        this.SaveErrorMessage(`Unhandled state: "${state}"!`);
                                        return {};
                        }
                }

                let answer: {
                        [x: string]: SqlSchema;
                } = {};
                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];
                        if (Object.keys(schema.tables).length > 0) {
                                answer[schemaName] = schema;
                        }
                }

                return answer;
        }

        GenerateEndpoint(schemas: { [x: string]: SqlSchema }) {
                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];

                        for (const tableName in schema.tables) {
                                if (!Object.prototype.hasOwnProperty.call(schema.tables, tableName)) {
                                        continue;
                                }
                                const table = schema.tables[tableName];
                                table.generateEndpoints();
                        }
                }
        }

        Run() {
                let lines: Array<string> = this.input.split('\n').filter((e) => !!e);
                let schemas = this.ProcessLines(lines);
                this.GenerateEndpoint(schemas);
                this.output = schemas;
                return this;
        }

        ExtractSqlOptions(
                values: Array<string>,
                position: number
        ): {
                options: Array<string>;
                validation: AttrValidation;
        } {
                let remainingItems = values.slice(position, values.length);
                let relevantRemainingItems: string[] = [];
                let attrValidation: AttrValidation = {
                        required: false,
                };

                for (let i = 0; i < remainingItems.length; i++) {
                        let option = remainingItems[i];
                        option = option.trim();
                        if (!option) continue;
                        if (relevantRemainingItems[relevantRemainingItems.length - 1] === '*' && option === '*') {
                                relevantRemainingItems[relevantRemainingItems.length - 1] += '*';
                        } else {
                                relevantRemainingItems.push(option);
                        }
                        let range = parseRange(option);
                        if (!range) continue;
                        attrValidation.range = range;
                }

                function parseRange(input: string): RangeResult | null {
                        // Define the regex pattern to match 'number..number' or 'decimal..decimal'
                        const rangePattern = /^\s*(\d+(\.\d+)?)\s*\.\.\s*(\d+(\.\d+)?)\s*$/;
                        const match = input.match(rangePattern);
                        if (!match) {
                                return null;
                        }
                        // const min = parseFloat(match[1]);
                        // const max = parseFloat(match[3]);
                        const min = match[1];
                        const max = match[3];
                        return { min, max };
                }

                return {
                        options: relevantRemainingItems,
                        validation: attrValidation,
                };
        }

        ParseSqlSchema(line: string): SqlSchema {
                let splitSqlAttribute: Array<string> = line.trim().split(' ');
                // Because matching regex gets us this far re grantee items in these positions
                let value = splitSqlAttribute[1];
                let options = this.ExtractSqlOptions(splitSqlAttribute, 2);

                let schema = new SqlSchema(value);
                schema.tables = {};
                schema.options = options.options;
                return schema;
        }

        ParseSqlAttribute(line: string, sqlType: SqlType, parentTable: SqlTable): SqlTableAttribute {
                let splitSqlAttribute: Array<string> = line.trim().split(' ');
                // Because matching regex gets us this far re grantee items in these positions
                let shortHandType = splitSqlAttribute[1];
                let value = splitSqlAttribute[2];
                let options = this.ExtractSqlOptions(splitSqlAttribute, 3);

                let validOptions: Array<string> = [];
                let invalidOptions: Array<string> = [];
                for (let k = 0; k < options.options.length; k++) {
                        const option = options.options[k];
                        let optionAdded = false;

                        // todo a better way of seeing the option was a range
                        if (option.includes('..')) continue;

                        for (const key in ATTRIBUTE_OPTION) {
                                const sqlTableAttrOption = ATTRIBUTE_OPTION[key];
                                if (!sqlTableAttrOption.test(option)) {
                                        continue;
                                }
                                optionAdded = true;
                                validOptions.push(option);
                        }
                        if (!optionAdded) {
                                invalidOptions.push(option);
                        }
                }

                let wantToBeReadOnly = value[0] === '_';
                if (wantToBeReadOnly) {
                        value = value.replace('_', '');
                }

                let rangeAcceptable = this.ValidateRangeValidationForAttribute(options, sqlType);
                if (options.validation.range && !rangeAcceptable.pass) {
                        options.validation.range = undefined;
                        let specificReasons = rangeAcceptable.messages.join(' and ');
                        this.SaveErrorMessage(`Range for '${value}' was unacceptable. ${specificReasons}`);
                }

                let attribute: SqlTableAttribute = new SqlTableAttribute(
                        parentTable,
                        sqlType,
                        value,
                        wantToBeReadOnly,
                        shortHandType,
                        new Set([...validOptions]),
                        options.validation
                );

                attribute.validation.required = !attribute.isNullable();

                // TODO improve default validation

                let defaultCandidate = invalidOptions.join(' ');

                if (!defaultCandidate) {
                        return attribute;
                }
                if (!attribute.isModifiable()) {
                        this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored because it is not modifiable.`);
                } else if (attribute.isDefaultNull()) {
                        this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored because it is already defaulted to null.`);
                } else if (attribute.isForeignKey()) {
                        this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored because it is a foreign key.`);
                } else if (defaultCandidate.match(/^[nN][uU][lL]{1,2}$/)) {
                        if (attribute.isNullable()) {
                                attribute.defaultValue = null;
                        } else {
                                this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored because it was flagged as not null.`);
                        }
                } else if (attribute.isNumerical()) {
                        if (defaultCandidate.match(/^[0-9]{1,}$/)) {
                                attribute.defaultValue = defaultCandidate;
                        } else {
                                this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored. Only a numerical default value works for a number.`);
                        }
                } else if (attribute.isText()) {
                        // if (defaultCandidate.match(/^[a-zA-Z ]{1,}$/)) {
                        //         // todo add max len check ?
                        // } else {
                        //         this.SaveErrorMessage(
                        //                 `Default value '${defaultCandidate}' was ignored. Only a string default value works for a string.`
                        //         );
                        // }
                        attribute.defaultValue = `'${defaultCandidate}'`;
                } else if (defaultCandidate.match(/^[a-zA-Z_]{1,32}$/)) {
                        // Aims to support CURRENT_TIMESTAMP and such
                        attribute.defaultValue = `${defaultCandidate}`;
                } else {
                        this.SaveErrorMessage(`Default value '${defaultCandidate}' was ignored. Unsure how to handle it.`);
                }

                return attribute;
        }

        private ValidateRangeValidationForAttribute(
                options: { options: Array<string>; validation: AttrValidation },
                sqlType: SqlType
        ): {
                pass: boolean;
                messages: string[];
        } {
                let decimalRange = [SqlType.DECIMAL, SqlType.FLOAT, SqlType.REAL];
                let wholeNumberRange = [SqlType.SERIAL, SqlType.INT, SqlType.VARCHAR];
                let range = options.validation.range;
                let messages = [];
                if (range) {
                        if (decimalRange.includes(sqlType)) {
                                if (!range.min.toString().includes('.')) {
                                        messages.push("min must include a '.'");
                                }
                                if (!range.max.toString().includes('.')) {
                                        messages.push("max must include a '.'");
                                }
                        } else if (wholeNumberRange.includes(sqlType)) {
                                if (range.min.toString().includes('.')) {
                                        messages.push("min cannot include a '.'");
                                }
                                if (range.max.toString().includes('.')) {
                                        messages.push("max cannot include a '.'");
                                }
                        }
                        // we know parse should work when creating the validation with regex for numbers
                        const min = parseFloat(range.min);
                        const max = parseFloat(range.max);
                        if (min > max) {
                                messages.push('minimum must be less than maximum');
                        }
                }

                return {
                        pass: messages.length === 0,
                        messages: messages,
                };
        }

        ParseSqlTable(parentSchema: SqlSchema, line: string): SqlTable {
                let splitLine = line.split(' ');
                let label = splitLine[1];
                let options = this.ExtractSqlOptions(splitLine, 2);

                let newTable: SqlTable = new SqlTable(parentSchema, label);

                newTable.label = label;
                newTable.options = options.options;

                if (newTable.options.includes('@')) {
                        let attr = new SqlTableAttribute(
                                newTable,
                                SqlType.TIMESTAMP,
                                'record_created_on',
                                true,
                                'ts',
                                new Set(['!']),
                                {
                                        required: true,
                                },
                                true
                        );
                        attr.defaultValue = 'CURRENT_TIMESTAMP';
                        newTable.attributes[attr.value] = attr;
                }
                if (newTable.options.includes('+')) {
                        let attr = new SqlTableAttribute(
                                newTable,
                                SqlType.SERIAL,
                                'id',
                                true,
                                'i',
                                new Set(['!', '+']),
                                {
                                        required: true,
                                },
                                true
                        );
                        newTable.attributes[attr.value] = attr;
                }
                return newTable;
        }

        ValidTable(
                newTable: SqlTable,
                tables: {
                        [x: string]: SqlTable;
                }
        ): boolean {
                let tableLabels = Object.keys(tables);
                let tableAlreadyExists = tableLabels.includes(newTable.label);
                if (tableAlreadyExists) {
                        this.SaveErrorMessage(`Duplicate table ${newTable.label} detected. Only the first one is used.`);
                        return false;
                }

                if (!/^[a-zA-Z_]{3,32}$/.test(newTable.label)) {
                        this.SaveErrorMessage(`Did not add table '${newTable.label}' because it must be a string'.`);
                        return false;
                }
                return true;
        }

        /**
         *
         * @param {SqlTableAttribute} attr
         * @param {Array.<SqlSchema>} schemas
         * @returns {null | Array.<SqlTableAttribute>}
         */
        CreateReferenceAttributes(
                attr: SqlTableAttribute,
                schemas: {
                        [x: string]: SqlSchema;
                }
        ): null | Array<SqlTableAttribute> {
                if (!attr.isForeignKey()) {
                        return null;
                }

                let foreignTableName: string = attr.value;
                let foreignTableSchemaName: string | null = null;
                let foreignTableNameAlias: string = '';

                // Part A
                if (/[a-zA-Z]{1,}\|[a-zA-Z]{1,}/.test(attr.value)) {
                        let splitValue = attr.value.split('|');
                        foreignTableName = splitValue[0];
                        foreignTableNameAlias = splitValue[1];
                }

                // find (if there is) the referenced schema
                if (/[a-zA-Z]{1,}\.[a-zA-Z]{1,}/.test(foreignTableName)) {
                        let splitValue = foreignTableName.split('.');
                        foreignTableSchemaName = splitValue[0];
                        foreignTableName = splitValue[1];
                }

                // no schema specified so we use the current schema
                if (!foreignTableSchemaName) {
                        // String keys are ordered in the order they were added
                        let schemaList = Object.values(schemas);
                        let lastSchema = schemaList[schemaList.length - 1];
                        foreignTableSchemaName = lastSchema.name;
                }

                if (!/^[a-zA-Z_]{3,32}$/.test(foreignTableName)) {
                        this.SaveErrorMessage(`Did not add reference to table '${attr.value}' because it must be a valid string.`);
                        return null;
                }

                let answer: SqlTableAttribute[] = [];

                // Part B
                // get columns from referenced table
                let referencedSchema = schemas[foreignTableSchemaName];
                if (!referencedSchema) {
                        this.SaveErrorMessage(`Did not add reference '${attr.value}' because cannot find schema '${foreignTableSchemaName}'.`);
                        return null;
                }
                let referencedTable = referencedSchema.tables[foreignTableName];

                if (!referencedTable) {
                        this.SaveErrorMessage(
                                `Did not add reference '${attr.value}' because cannot find table '${foreignTableName}' in schema '${referencedSchema.name}'.`
                        );
                        return null;
                }

                let keys = referencedTable.primaryKeys();

                for (const attributeName in keys) {
                        if (!Object.prototype.hasOwnProperty.call(keys, attributeName)) {
                                continue;
                        }
                        const key = keys[attributeName];

                        let type = key.sqlType;

                        // take the type and make a value based on referenced table
                        if (type === SqlType.SERIAL) {
                                type = SqlType.INT;
                        }

                        // add the reference to
                        let referenceTo = new SqlReferenceTo(foreignTableNameAlias, key);

                        let referenceToSelf = false;
                        if (attr.parentTable.id === referencedTable.id) {
                                referenceToSelf = true;
                                if (!foreignTableNameAlias) {
                                        foreignTableNameAlias = `${UNALIASED_SELF_REFERENCE_ALIAS}${attr.parentTable.label}`;
                                }
                        }

                        let value = '';
                        if (foreignTableNameAlias) {
                                value = `${foreignTableNameAlias}_${key.value}`;
                        } else {
                                value = `${foreignTableName}_${key.value}`;
                        }

                        // take in the options from the attributes that are references
                        let options = attr.options;
                        let defaultValue = attr.defaultValue;

                        let newAttribute = new SqlTableAttribute(attr.parentTable, type, value, attr.readOnly, attr.shortHandType, options, {
                                required: false,
                        });
                        newAttribute.referenceTo = referenceTo;
                        newAttribute.referenceToSelf = referenceToSelf;
                        newAttribute.defaultValue = defaultValue;
                        newAttribute.validation.required = attr.validation.required;

                        answer.push(newAttribute);
                }

                if (answer.length === 0) {
                        return null;
                }

                if (attr.readOnly) {
                        answer = answer.map((e) => {
                                e.readOnly = true;
                                return e;
                        });
                }

                return answer;
        }

        ValidAttribute(attr: SqlTableAttribute, table: SqlTable): boolean {
                if (attr.sqlType === SqlType.VARCHAR && !attr.validation.range) {
                        this.SaveErrorMessage(`'${attr.value}' on '${table.label}' lacks a valid range. (e.g. '0..255')`);
                        return false;
                }

                for (const attributeName in table.attributes) {
                        if (!Object.prototype.hasOwnProperty.call(table.attributes, attributeName)) {
                                continue;
                        }
                        const attribute = table.attributes[attributeName];

                        if (attribute.value === attr.value) {
                                this.SaveErrorMessage(`'${attr.value}' on '${table.label}' already exists`);
                                return false;
                        }

                        if (`${attribute.referenceTo?.column.parentTable.label}|${attribute.referenceTo?.tableAlias}` === attr.value) {
                                this.SaveErrorMessage(`'${attr.value}' on '${table.label}' already exists`);
                                return false;
                        }
                }

                if (!attr.isNullable() && attr.isDefaultNull()) {
                        this.SaveErrorMessage(`'${attr.value}' on '${table.label}' has conflicting nullability flags`);
                        return false;
                }

                if (attr.isForeignKey() && !attr.referenceTo) {
                        this.SaveErrorMessage(`reference '${attr.value}' was not fround or is missing a suitable primary key`);
                        return false;
                }
                return true;
        }

        CreateAttributes(
                line: string,
                schemas: {
                        [x: string]: SqlSchema;
                },
                table: SqlTable
        ): Array<SqlTableAttribute> | null {
                for (const sqlType in SQL_TABLE_ATTRIBUTES) {
                        const sqlTypeCheck = SQL_TABLE_ATTRIBUTES[sqlType];
                        if (!sqlTypeCheck.test(line)) {
                                continue;
                        }
                        let typicalAttribute = this.ParseSqlAttribute(line, sqlType as SqlType, table);
                        if (typicalAttribute.isForeignKey()) {
                                let foreignAttributes = this.CreateReferenceAttributes(typicalAttribute, schemas);
                                return foreignAttributes;
                        } else {
                                return [typicalAttribute];
                        }
                }
                return null;
        }

        DetermineNextState(line: string): number {
                for (let i = 0; i < STATE_CHANGE_TRIGGERS.length; i++) {
                        const stateChangeTriggerCheck = STATE_CHANGE_TRIGGERS[i][0];
                        const stateChangeTriggerResult = STATE_CHANGE_TRIGGERS[i][1];
                        if (stateChangeTriggerCheck.test(line)) {
                                return stateChangeTriggerResult;
                        }
                }
                return TokenizingState.None;
        }
}
