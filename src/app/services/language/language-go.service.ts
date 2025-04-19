import {Injectable} from '@angular/core'
import {groupBy, TAB} from '../../constants'
import {alignKeyword, cc, fixPluralGrammar} from '../../formatting'
import {Func, AppGeneratorMode, Schema, Table, FuncOut} from '../../structure'

@Injectable({
    providedIn: 'root'
})
export class LanguageGoService {
    static ToStructs(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.GoStructsAndFns)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        for (const f of funcs) {
            // Struct

            lines.push(`type ${f.title} = struct {`)
            const attrs: string[] = LanguageGoService.generateStructAttributes(f)
            lines = lines.concat(attrs)
            lines.push(`}\n`)

            // Func

            let funcAttrs: string[] = LanguageGoService.generateFuncReturnStruct(f)
            const {title, params} = LanguageGoService.generateTitleAndParams(f)

            lines.push(`func ${title} (${params}) ${f.title} {`)
            lines.push(`${TAB}return ${f.title} {`)

            funcAttrs = alignKeyword(funcAttrs, ' :')
            lines = lines.concat(funcAttrs)

            lines.push(`${TAB}}`)
            lines.push(`}\n`)
        }

        const str = lines.join('\n')
        return str
    }

    private static generateTitleAndParams(f: Func) {
        const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
        const params = Object.entries(groupBy(relevantInputs, 'type'))
            // .sort((a, b) => a[0].localeCompare(b[0]))
            // .map((e) => {
            //   e[1] = e[1].sort((a, b) => a.label.localeCompare(b.label));
            //   return e;
            // })
            .map(e => {
                return `${e[1].map(r => r.label).join(', ')} ${e[0]}`
            })
            .join(', ')

        const title = cc(`New_${f.title}`, 'pl')
        return {title, params}
    }

    private static generateFuncReturnStruct(f: Func) {
        const funcAttrs: string[] = []
        for (const o of f.outputs) {
            if (o.relatedInput === null) {
                funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.defaultValue},`)
                continue
            }
            funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.relatedInput.label},`)
        }

        return funcAttrs
    }

    private static generateStructAttributes(f: Func) {
        let attrs: string[] = []
        for (const e of f.outputs) {
            attrs.push(`${TAB}${e.label} ~~${e.relatedInput ? e.relatedInput.type : e.type} \`json:"${cc(e.label, 'sk')}"\``)
        }
        attrs = alignKeyword(attrs, '~~')
        attrs = attrs.map(e => e.replace('~~', ''))
        attrs = alignKeyword(attrs, '`json:')
        return attrs
    }

    static ToAPIWithPostgres(schemas: Schema[]): string {
        const funcs: [Func, Table][] = []

        for (const s of schemas) {
            for (const t of s.Tables) {
                funcs.push([new Func(t, AppGeneratorMode.GoStructsAndFns), t])
            }
        }

        const lines: string[] = []

        const pkVars = (f: Func) => {
            return f.outputs.filter(e => e.primary).map(e => cc(e.label, 'cm'))
        }

        const paginationFn = `func GetPagination(r *http.Request, defaultLimit, defaultPage int) (offset, limit, page int) {
    limit = defaultLimit
    page = defaultPage

    limitStr := r.URL.Query().Get("limit")
    if limitStr != "" {
        if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
            limit = parsedLimit
        }
    }

    pageStr := r.URL.Query().Get("page")
    if pageStr != "" {
        if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
            page = parsedPage
        }
    }

    offset = (page - 1) * limit
    return offset, limit, page
}`

        lines.push(paginationFn)
        lines.push('')

        for (const [funcGo, table] of funcs) {
            const items = cc(fixPluralGrammar(funcGo.title + 's'), 'sk')
            const item = cc(funcGo.title, 'sk')

            const queryIn: string[] = pkVars(funcGo)
            const getParams: FuncOut[] = []

            const pks = funcGo.outputs.filter(e => e.primary)

            const w: string[] = []

            let i = 0
            for (const e of table.Attributes) {
                if (!e.Option?.PrimaryKey) continue
                if (!e.RefTo) {
                    i += 1
                    w.push(`${cc(e.Name, 'sk')} = $${i}`)
                    continue
                }
                for (const r of e.RefTo.Attributes) {
                    if (!r.Option?.PrimaryKey) continue
                    i += 1
                    w.push(`${cc(e.Name, 'sk')}.${cc(r.Name, 'sk')} = $${i}`)
                }
            }

            const selectWhereLen = w.length
            const selectWhere = w.join(' AND ')

            /**
             *
             * setup
             *
             */

            for (const pk of pks) {
                // const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
                // const params = Object.entries(groupBy(relevantInputs, 'type'))
                getParams.push(pk)
            }

            // const getParamsStr = Object.entries(groupBy(getParams, 'type'))
            //     .map(e => {
            //         return `${e[1].map(r => cc(r.label, 'cm')).join(', ')} ${e[0]}`
            //     })
            //     .join(', ')
            const getParamsStr = getParams
                .map(e => {
                    return `${cc(e.label, 'cm')} ${e.type}`
                })
                .join(', ')
            const getParamsStrWithoutType = getParams
                .map(e => {
                    return `${cc(e.label, 'cm')}`
                })
                .join(', ')
            const getParamsStrWithoutTypeWithAnd = getParams
                .map(e => {
                    return `${cc(e.label, 'cm')}`
                })
                .join(' and ')

            const notFoundStr = `cannot find ${cc(table.Name, 'sk')} matching that ${getParamsStrWithoutTypeWithAnd}`
            const getParamsStrOnlyType = getParams.map(e => e.type).join(', ')
            const getParamsStrDefaultValues = getParams.map(e => e.defaultValue).join(', ')

            const queryInStr = queryIn.join(', ')

            lines.push(`// ${funcGo.title} handlers\n`)

            /**
             *
             * GetMany
             *
             */
            {
                const l: string[] = []

                lines.push(`func GetMany${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)

                const selecting = table.Attributes.map(e => cc(e.Name, 'sk')).join(', ')

                let orderBy = ''
                const pks = funcGo.table.AllPrimaryDeterminedIdentifiers()
                if (pks.length > 0) {
                    orderBy = 'ORDER BY ' + pks.map(e => `${e} ASC`).join(', ')
                }

                const sel = `SELECT ${selecting} FROM ${table.FN}`
                const page = `LIMIT $1 OFFSET $2`
                const query = [sel, orderBy, page].filter(e => e.trim().length > 0).join(' ')

                l.push(`offset, limit, page := services.GetPagination(r, 10, 1)`)

                l.push(`rows, err := db.Query("${query}", limit, offset)`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)
                l.push(`defer rows.Close()\n`)
                l.push(`${items} := []${funcGo.title}{}`)
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
                l.push(`w.WriteHeader(http.StatusOK)`)
                l.push(`w.Header().Set("Content-Type", "application/json")`)
                l.push(`if err := json.NewEncoder(w).Encode(${items}); err != nil {`)
                l.push(`    http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`}`)

                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }

            /**
             *
             * gatherContext
             *
             */
            gatherContext: {
                if (pks.length === 0) {
                    lines.push(`-- NOTICE: skipping "gatherContext" methods for ${funcGo.title} due to lacking a primary key`)
                    break gatherContext
                }

                const pkStrs: string[] = []

                for (const pk of pks) {
                    const l: string[] = []

                    const s = cc(pk.label, 'sk')
                    const vn = cc(pk.label, 'cm')

                    if (pk.needsParsed) {
                        l.push(`${vn}Str := r.URL.Query().Get("${s}")`)
                        const parseStr = pk.parseFn(`${vn}Str`)
                        l.push(`${vn}, err := ${parseStr}; `)
                        l.push(`if err != nil {`)
                        l.push(`${TAB}return ${getParamsStrDefaultValues}, errors.New("invalid ${vn}")`)
                        l.push(`}`)
                    } else {
                        l.push(`${vn} := r.URL.Query().Get("${s}")`)
                        l.push(`if ${vn} == "" {`)
                        l.push(`${TAB}return ${getParamsStrDefaultValues}, errors.New("invalid ${vn}")`)
                        l.push(`}`)
                    }
                    l.push('')

                    const pkStr = l.join(`\n${TAB}`).trim()

                    pkStrs.push(pkStr)
                }

                lines.push(`func gather${funcGo.title}Context(r *http.Request) (${getParamsStrOnlyType}, error) {`)

                const l: string[] = []

                l.push(pkStrs.join(`\n${TAB}`))

                l.push(`return ${getParamsStrWithoutType}, nil`)
                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }

            /**
             *
             * SELECT
             *
             */
            select: {
                if (pks.length === 0) {
                    lines.push(`-- NOTICE: skipping "select" methods for ${funcGo.title} due to lacking a primary key`)
                    break select
                }

                lines.push(`func select${funcGo.title}(${getParamsStr}) (*${funcGo.title}, error) {`)

                const l: string[] = []

                const selecting = table.Attributes.map(e => cc(e.Name, 'sk')).join(', ')
                const query = `SELECT ${selecting} FROM ${table.FN} WHERE ${selectWhere}`

                l.push(`${item} := ${funcGo.title}{}`)

                l.push(`row := db.QueryRow("${query}", ${queryInStr})`)

                const scan = funcGo.outputs
                    .filter(e => e.self)
                    .map(e => `&${item}.${e.label}`)
                    .join(', ')

                l.push(`err := row.Scan(${scan});`)
                l.push(`if err != nil {`)
                l.push(`${TAB}return nil, err`)
                l.push(`}`)

                l.push(`return &${item}, nil`)
                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }

            /**
             *
             * GET
             *
             */
            get: {
                if (pks.length === 0) {
                    lines.push(`-- NOTICE: skipping "get" methods for ${funcGo.title} due to lacking a primary key`)
                    break get
                }

                lines.push(`func Get${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)

                const l: string[] = []

                l.push(`${queryInStr}, err := gather${funcGo.title}Context(r)`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                // l.push('')

                l.push(`${item}, err := select${funcGo.title}(${queryInStr})`)
                l.push(`if err != nil {`)
                l.push(`${TAB}if err == sql.ErrNoRows {`)
                l.push(`${TAB}${TAB}http.Error(w, "${notFoundStr}", http.StatusInternalServerError)`)
                l.push(`${TAB}${TAB}return`)
                l.push(`${TAB}}`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)
                // l.push('')

                // for (const t2 of table.RefBy || []) {
                //     const t2f = new Func(t2, AppGeneratorMode.GoStructsAndFns)

                //     const queryIn: string[] = funcGo.outputs.filter(e => e.primary).map(e => `${item}.${cc(`${e.label}`, 'cm')}`)
                //     const queryInStr = queryIn.join(', ')

                //     const item2 = cc(t2f.title, 'sk')

                //     l.push(`${item2}, err := get${t2f.title}(${queryInStr})`)
                //     l.push(`if err != nil {`)
                //     l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                //     l.push(`${TAB}return`)
                //     l.push(`}`)
                //     // l.push(`${item}.${cc(item2, 'pl')} = ${item2}`)
                //     l.push('')

                //     for (const a of t2.Attributes) {
                //         if (!a.RefTo) continue
                //         if (a.RefTo.ID === table.ID) continue

                //         const t3 = a.RefTo

                //         const t3f = new Func(t3, AppGeneratorMode.GoStructsAndFns)

                //         const queryIn: string[] = funcGo.outputs.filter(e => e.primary).map(e => `${item2}.${cc(`${e.label}`, 'cm')}`)
                //         const queryInStr = queryIn.join(', ')

                //         const item3 = cc(t3f.title, 'sk')
                //         l.push(`${item3}, err := get${t3f.title}(${queryInStr})`)
                //         l.push(`if err != nil {`)
                //         l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                //         l.push(`${TAB}return`)
                //         l.push(`}`)
                //         l.push(`${item}.${cc(item3, 'pl')} = ${item3}`)
                //         l.push('')
                //     }
                // }

                l.push('')
                l.push(`w.Header().Set("Content-Type", "application/json")`)
                l.push(`if err := json.NewEncoder(w).Encode(${item}); err != nil {`)
                l.push(`    http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`}`)

                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }

            /**
             *
             * PUT
             *
             */
            put: {
                if (pks.length === 0) {
                    lines.push(`-- NOTICE: skipping "put" methods for ${funcGo.title} due to lacking a primary key`)
                    break put
                }

                lines.push(`func Put${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)
                const l: string[] = []

                l.push(`${queryInStr}, err := gather${funcGo.title}Context(r)`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
                l.push(`${TAB}return`)
                l.push(`}`)

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
                l.push(`res, err = db.Exec("${query}", ${fieldsStr})`)

                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, "Failed to update ${cc(table.Name, 'sk')}", http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                l.push(`rowsAffected, err := res.RowsAffected()`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                l.push(`if rowsAffected == 0 {`)
                l.push(`${TAB}http.Error(w, "${notFoundStr}", http.StatusNotFound)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                l.push(`w.WriteHeader(http.StatusOK)`)
                l.push(`w.Header().Set("Content-Type", "application/json")`)
                l.push(`if err := json.NewEncoder(w).Encode(${item}); err != nil {`)
                l.push(`    http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`}`)

                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }

            /**
             *
             * POST
             *
             */
            post: {
                if (pks.length === 0) {
                    lines.push(`-- NOTICE: skipping "post" methods for ${funcGo.title} due to lacking a primary key`)
                    break post
                }

                lines.push(`func Post${funcGo.title}(w http.ResponseWriter, r *http.Request) {`)
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
                l.push(`w.WriteHeader(http.StatusCreated)`)
                l.push(`w.Header().Set("Content-Type", "application/json")`)
                l.push(`if err := json.NewEncoder(w).Encode(${item}); err != nil {`)
                l.push(`    http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`}`)

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

                l.push(`${queryInStr}, err := gather${funcGo.title}Context(r)`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                const query = `DELETE FROM ${table.FN} WHERE ${selectWhere}`

                l.push(`_, err = db.Exec("${query}", ${queryInStr})`)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                l.push(`w.WriteHeader(http.StatusNoContent)`)

                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }
        }

        const str = lines.join('\n')
        return str
    }
}
