import {Injectable} from '@angular/core'
import {groupBy, TAB} from '../../constants'
import {alignKeyword, cc, fixPluralGrammar} from '../../formatting'
import {Func, AppGeneratorMode, Schema, Table, FuncOut} from '../../structure'
import {LanguageSqlService} from './language-sql.service'

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

            const validateFn: string[] = LanguageGoService.generateValidateFn(f)
            lines = lines.concat(validateFn)
            lines.push(``)

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

    private static generateValidateFn(f: Func) {
        let lines: string[] = []
        if (!f.hasValidation()) {
            return []
        }

        const fl = f.title.substring(0, 1).toLowerCase()
        lines.push(`func (${fl} ${f.title}) Validate () error {`)
        for (const o of f.outputs) {
            if (!o.raw.attribute.Validation) continue
            const v = o.raw.attribute.Validation
            const l: string[] = []
            if (o.raw.attribute.isStr()) {
                if (v.Min !== undefined) {
                    l.push(`if len(${fl}.${o.label}) < ${v.Min} {`)
                    l.push(`${TAB}return errors.New("'${cc(o.label, 'nc')}' must be at least ${v.Min} characters")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if len(${fl}.${o.label}) > ${v.Max} {`)
                    l.push(`${TAB}return errors.New("'${cc(o.label, 'nc')}' must be at most ${v.Max} characters")`)
                    l.push(`}`)
                }
            } else {
                if (v.Min !== undefined) {
                    l.push(`if ${fl}.${o.label} < ${v.Min} {`)
                    l.push(`${TAB}return errors.New("'${cc(o.label, 'nc')}' must be at least ${v.Min}")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if ${fl}.${o.label} > ${v.Max} {`)
                    l.push(`${TAB}return errors.New("'${cc(o.label, 'nc')}' must be at most ${v.Max}")`)
                    l.push(`}`)
                }
            }
            lines.push(`${TAB}` + l.join(`\n${TAB}`))
        }
        lines.push(`${TAB}return nil`)
        lines.push(`}`)

        lines = lines.filter(e => e.trim().length > 0)

        return lines
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

        lines.push('')

        for (const [funcGo, table] of funcs) {
            const items = cc(fixPluralGrammar(funcGo.title + 's'), 'cm')
            const item = cc(funcGo.title, 'cm')

            const queryIn: string[] = pkVars(funcGo)
            const getParams: FuncOut[] = []

            const pks = funcGo.outputs.filter(e => e.primary)

            const w: string[] = []
            const contextGatheredTheseIDs: string[] = []

            let i = 0

            for (const e of funcGo.outputs) {
                if (!e.primary) continue
                i += 1
                w.push(`${cc(e.label, 'sk')} = $${i}`)
                contextGatheredTheseIDs.push(`${cc(e.label, 'cm')}`)
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

            const notFoundStr = `cannot find ${cc(table.Name, 'sk')} matching that ${getParams
                .map(e => {
                    return `${cc(e.label, 'nc')}`
                })
                .join(' and ')}`
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

                const selecting: string[] = funcGo.outputs.map(e => cc(e.label, 'sk'))
                const selectingStr = selecting.join(', ')

                let orderBy = ''
                const pks = funcGo.outputs.filter(e => e.primary).map(e => e.label)
                if (pks.length > 0) {
                    orderBy = 'ORDER BY ' + pks.map(e => `${e} ASC`).join(', ')
                }

                const sel = `SELECT ${selectingStr} FROM ${table.FN}`
                const page = `LIMIT $1 OFFSET $2`
                let query = [sel, orderBy, page].filter(e => e.trim().length > 0).join(' ')
                query = LanguageSqlService.FormatQuery(query)

                l.push(`offset, limit, page := GetPagination(r, 10, 1)`)
                l.push(``)

                l.push(`rows, err := db.Query(\`${query}\`, limit, offset)`)
                l.push(``)
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
                        l.push(`${TAB}return ${getParamsStrDefaultValues}, errors.New("invalid '${cc(vn, 'nc')}'")`)
                        l.push(`}`)
                    } else {
                        l.push(`${vn} := r.URL.Query().Get("${s}")`)
                        l.push(`if ${vn} == "" {`)
                        l.push(`${TAB}return ${getParamsStrDefaultValues}, errors.New("invalid '${cc(vn, 'nc')}'")`)
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

                const selecting: string[] = funcGo.outputs.map(e => cc(e.label, 'sk'))
                const selectingStr = selecting.join(', ')

                let query = `SELECT ${selectingStr} FROM ${table.FN} WHERE ${selectWhere}`
                query = LanguageSqlService.FormatQuery(query)

                l.push(`${item} := ${funcGo.title}{}`)

                l.push(`row := db.QueryRow(\`${query}\`, ${queryInStr})`)
                l.push(``)

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

                if (funcGo.hasValidation()) {
                    l.push(`if err := ${item}.Validate(); err != nil {`)
                    l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
                    l.push(`${TAB}return`)
                    l.push(`}`)
                    l.push(``)
                }

                const cols: string[] = funcGo.outputs.filter(e => e.raw.attribute.toInsert()).map(e => `${cc(e.label, 'sk')}`)
                const aEqB: string[] = cols.map((e, i) => `${e} = $${selectWhereLen + i + 1}`)

                const aEqBStr: string = aEqB.join(', ')
                const fieldsStr: string = [...contextGatheredTheseIDs, ...cols].join(', ')

                let query = `UPDATE ${table.FN} SET ${aEqBStr} WHERE ${selectWhere}`
                query = LanguageSqlService.FormatQuery(query)

                l.push(`res, err = db.Exec(\`${query}\`, ${fieldsStr})`)
                l.push(``)

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

                if (funcGo.hasValidation()) {
                    l.push(`if err := ${item}.Validate(); err != nil {`)
                    l.push(`${TAB}http.Error(w, err.Error(), http.StatusBadRequest)`)
                    l.push(`${TAB}return`)
                    l.push(`}`)
                    l.push(``)
                }

                const valuesAttrs: string[] = funcGo.outputs.filter(e => e.raw.attribute.toInsert()).map(e => `${item}.${cc(e.label, 'pl')}`)
                const cols: string[] = funcGo.outputs.filter(e => e.raw.attribute.toInsert()).map(e => `${cc(e.label, 'sk')}`)
                const scans: string[] = funcGo.outputs.filter(e => e.primary).map(e => `&${item}.${e.label}`)

                const valuePlaceHolders: string[] = []

                for (let i = 0; i < valuesAttrs.length; i++) {
                    valuePlaceHolders.push(`$${i + 1}`)
                }

                const valuePlaceHolderStr = valuePlaceHolders.join(', ')
                const valuesAttrsStr = valuesAttrs.join(', ')
                const scansStr = scans.join(', ')
                const colsStr = cols.join(', ')

                const returning: string[] = funcGo.outputs.filter(e => e.primary).map(e => cc(e.label, 'sk'))
                const returningStr = returning.join(', ')

                let query = `INSERT INTO ${table.FN} (${colsStr}) VALUES (${valuePlaceHolderStr}) RETURNING ${returningStr}`
                query = LanguageSqlService.FormatQuery(query)

                l.push(`err := db.QueryRow(\`${query}\`, ${valuesAttrsStr}).Scan(${scansStr})`)
                l.push(``)
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

                let query = `DELETE FROM ${table.FN} WHERE ${selectWhere}`
                query = LanguageSqlService.FormatQuery(query)

                l.push(`_, err = db.Exec(\`${query}\`, ${queryInStr})`)
                l.push(``)
                l.push(`if err != nil {`)
                l.push(`${TAB}http.Error(w, err.Error(), http.StatusInternalServerError)`)
                l.push(`${TAB}return`)
                l.push(`}`)

                l.push(`w.WriteHeader(http.StatusNoContent)`)

                lines.push(`${TAB}` + l.join(`\n${TAB}`))
                lines.push(`}\n`)
            }
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

        const str = lines.join('\n')
        return str
    }
}
