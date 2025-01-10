import {TAB} from '../../constants'
import {cc, fixPluralGrammar} from '../../formatting'
import {Schema, Func, AppGeneratorMode, Table} from '../../structure'

export function SchemasToApiGoPostgres(schemas: Schema[]): string {
    const funcs: [Func, Table][] = []

    for (const s of schemas) {
        for (const t of s.Tables) {
            funcs.push([new Func(t, AppGeneratorMode.GoStructsAndFns), t])
        }
    }

    const lines: string[] = []

    for (const [funcGo, table] of funcs) {
        const items = cc(fixPluralGrammar(funcGo.title + 's'), 'sk')
        const item = cc(funcGo.title, 'sk')

        const pkStrs: string[] = []
        const queryIn: string[] = []

        const pks = funcGo.outputs.filter(e => e.primary)

        const w = table.Attributes.filter(e => e.Option?.PrimaryKey).map((e, i) => `${cc(e.Name, 'sk')} = $${i + 1}`)
        const selectWhereLen = w.length
        const selectWhere = w.join(' AND ')

        /**
         *
         * setup
         *
         */

        for (const pk of pks) {
            const l: string[] = []

            const s = cc(pk.label, 'sk')
            const vn = cc(pk.label, 'cm')

            queryIn.push(vn)

            l.push(`${vn} := r.URL.Query().Get("${s}")`)
            l.push(`if ${vn} == "" {`)
            l.push(`${TAB}http.Error(w, "${s} parameter is missing", http.StatusBadRequest)`)
            l.push(`${TAB}return`)
            l.push(`}`)

            const pkStr = l.join(`\n${TAB}`)

            pkStrs.push(pkStr)
        }

        const queryInStr = queryIn.join(', ')

        const queryParams = pkStrs.join(`\n${TAB}`)

        lines.push(`-- ${funcGo.title} handlers\n`)

        /**
         *
         * INDEX
         *
         */
        {
            const l: string[] = []
            lines.push(`func Index${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)

            const selecting = table.Attributes.map(e => cc(e.Name, 'sk')).join(', ')
            const query = `SELECT ${selecting} FROM ${table.FN}`

            l.push(`rows, err := db.Query("${query}")`)
            l.push(`if err !== nil {`)
            l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
            l.push(`${TAB}return`)
            l.push(`}`)
            l.push(`defer rows.Close()\n`)
            l.push(`${items} := []${funcGo.title}`)
            l.push(`for rows.Next() {`)
            l.push(`${TAB}${item} := ${funcGo.title}{}`)

            const scan = funcGo.outputs
                .filter(e => e.self)
                .map(e => `&${item}.${e.label}`)
                .join(', ')
            l.push(`${TAB}if err := rows.Scan(${scan}); err != nil {`)
            l.push(`${TAB}${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
            l.push(`${TAB}${TAB}return`)
            l.push(`${TAB}}`)
            l.push(`${TAB}${items} = append(${items}, ${item})`)
            l.push(`}`)

            l.push('')
            l.push(`w.Header().Set("Content-Type", "application/json")`)
            l.push(`json.NewEncoder(w).Encode(${items})`)

            lines.push(`${TAB}` + l.join(`\n${TAB}`))
            lines.push(`}\n`)
        }

        /**
         *
         * SHOW
         *
         */
        show: {
            if (pks.length === 0) {
                lines.push(`-- NOTICE: skipping "show" methods for ${funcGo.title} due to lacking a primary key`)
                break show
            }

            lines.push(`func Show${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)

            const l: string[] = []

            l.push(queryParams)

            l.push('')

            const selecting = table.Attributes.map(e => cc(e.Name, 'sk')).join(', ')
            const query = `SELECT ${selecting} FROM ${table.FN} WHERE ${selectWhere}`

            l.push(`${item} := ${funcGo.title}{}`)

            l.push(`rows := db.QueryRow("${query}", ${queryInStr})`)

            const scan = funcGo.outputs
                .filter(e => e.self)
                .map(e => `&${item}.${e.label}`)
                .join(', ')

            l.push(`if err := rows.Scan(${scan}); err != nil {`)
            l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
            l.push(`${TAB}return`)
            l.push(`}`)

            l.push('')
            l.push(`w.Header().Set("Content-Type", "application/json")`)
            l.push(`json.NewEncoder(w).Encode(${item})`)

            lines.push(`${TAB}` + l.join(`\n${TAB}`))
            lines.push(`}\n`)
        }

        /**
         *
         * EDIT
         *
         */
        edit: {
            if (pks.length === 0) {
                lines.push(`-- NOTICE: skipping "edit" methods for ${funcGo.title} due to lacking a primary key`)
                break edit
            }

            lines.push(`func Edit${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)
            const l: string[] = []

            l.push(queryParams)

            l.push(`${item} := ${funcGo.title}{}`)

            l.push(`if err := json.NewDecoder(r.Body).Decode(&${item}); err != nil {`)
            l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
            l.push(`${TAB}return`)
            l.push(`}`)
            l.push(``)

            const cols = table.Attributes.filter(e => e.toInsert())

            const aEqB: string[] = cols.map((e, i) => `${cc(e.Name, 'sk')} = $${selectWhereLen + i + 1}`)
            const colsSnake = cols.map(e => cc(e.Name, 'sk'))

            const fieldsB = funcGo.outputs.filter(e => colsSnake.includes(cc(e.label, 'sk'))).map(e => `${item}.${e.label}`)

            const fields = [...queryIn, ...fieldsB]

            const aEqBStr: string = aEqB.join(', ')
            const fieldsStr: string = fields.join(', ')

            const query = `UPDATE ${table.FN} SET ${aEqBStr} WHERE ${selectWhere}`
            l.push(`_, err = db.Exec("${query}", ${fieldsStr})`)
            l.push(`if err != nil {`)
            l.push(`${TAB}http.Error(w, "Failed to update ${cc(table.Name, 'sk')}", http.StatusInternalServerError)`)
            l.push(`${TAB}return`)
            l.push(`}`)

            l.push(`w.Header().Set("Content-Type", "application/json")`)
            l.push(`json.NewEncoder(w).Encode(${item})`)

            lines.push(`${TAB}` + l.join(`\n${TAB}`))
            lines.push(`}\n`)
        }

        /**
         *
         * NEW
         *
         */
        new_: {
            if (pks.length === 0) {
                lines.push(`-- NOTICE: skipping "new" methods for ${funcGo.title} due to lacking a primary key`)
                break new_
            }

            lines.push(`func New${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)
            const l: string[] = []

            l.push(`${item} := ${funcGo.title}{}`)

            l.push(`if err := json.NewDecoder(r.Body).Decode(&${item}); err != nil {`)
            l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
            l.push(`${TAB}return`)
            l.push(`}`)
            l.push(``)

            const cols = table.Attributes.filter(e => e.toInsert()).map(e => cc(e.Name, 'sk'))

            const values: string[] = []
            const valuesAttrs: string[] = []
            const scans: string[] = funcGo.outputs.filter(e => e.primary).map(e => `&${item}.${e.label}`)

            const colsSnake = cols.map(e => cc(e, 'sk'))

            const fields = funcGo.outputs.filter(e => colsSnake.includes(cc(e.label, 'sk')))

            for (let i = 0; i < fields.length; i++) {
                const field = fields[i]
                values.push(`$${i + 1}`)
                valuesAttrs.push(`${item}.${field.label}`)
            }

            const valuesStr = values.join(', ')
            const valuesAttrsStr = valuesAttrs.join(', ')
            const scansStr = scans.join(', ')
            const colsStr = cols.join(', ')

            const returning: string = table.Attributes.filter(e => e.Option?.PrimaryKey)
                .map(e => cc(e.Name, 'sk'))
                .join(', ')

            const query = `INSERT INTO ${table.FN} (${colsStr}) VALUES (${valuesStr}) RETURNING ${returning}`

            l.push(`err := db.QueryRow("${query}", ${valuesAttrsStr}).Scan(${scansStr})`)
            l.push(`if err != nil {`)
            l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
            l.push(`${TAB}return`)
            l.push(`}`)

            l.push(``)
            l.push(`w.Header().Set("Content-Type", "application/json")`)
            l.push(`json.NewEncoder(w).Encode(${item})`)

            lines.push(`${TAB}` + l.join(`\n${TAB}`))
            lines.push(`}\n`)
        }

        /**
         *
         * DELETE
         *
         */
        delete_: {
            if (pks.length === 0) {
                lines.push(`-- NOTICE: skipping "delete" methods for ${funcGo.title} due to lacking a primary key`)
                break delete_
            }

            lines.push(`func Delete${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)
            const l: string[] = []

            l.push(queryParams)

            const query = `DELETE FROM ${table.FN} WHERE ${selectWhere}`

            l.push(`${TAB}_, err := db.Exec("${query}", ${queryInStr})`)
            l.push(`${TAB}if err != nil {`)
            l.push(`${TAB}${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
            l.push(`${TAB}${TAB}return`)
            l.push(`${TAB}}`)

            l.push(`w.WriteHeader(http.StatusNoContent)`)

            lines.push(`${TAB}` + l.join(`\n${TAB}`))
            lines.push(`}\n`)
        }
    }

    const str = lines.join('\n')
    return str
}
