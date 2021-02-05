import { createClient } from '@supabase/supabase-js'

const arrayfy = payload => Array.isArray(payload) ? payload : [ payload ]

export default {
    install(Vue, { supabaseUrl, supabaseKey, store, tables }) {

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Vue.prototype.$supa = (table, action = null, payload = null, payload2 = null) => {
        //     payload = Array.isArray(payload) ? payload : [ payload ]
        //     if(!action)
        //         return supabase.from(table).select('*')
        //     if(action == 'insert')
        //         return supabase.from(table).insert(payload)
        //     if(action == 'delete')
        //         return supabase.from(table).delete().in('id', payload)
        //     if(action == 'update')
        //         return supabase.from(table).update(payload2).in('id', payload)
        // }

        Vue.prototype.$supa = table => {
            table = supabase.from(table)
            return {
                get: async ({ select, orderBy, dir } = {}) => await table.select(select || '*').order(orderBy || 'id', { ascending: dir != 'desc' }),
                insert: async payload => await table.insert(arrayfy(payload)),
                delete: async ids => await table.delete().in('id', arrayfy(ids)),
                update: async (ids, payload) => await table.update(payload).in('id', arrayfy(ids)),
            }
        }
        
        Vue.prototype.$supaAuth = supabase.auth

        // Vue.prototype.$supaWatch = async (table, list /*, callbacks*/) => {

        //     // supabase.from(table).on('*', ({ eventType, new: row, old: deleted }) => {
        //     //     if(eventType == 'INSERT')
        //     //         list.push(row)
        //     //     else if(['DELETE', 'UPDATE'].includes(eventType)) {
        //     //         let index = list.findIndex(q => q.id == (deleted?.id || row.id))
        //     //         Vue.set(list, index, row)
        //     //         if(deleted?.id)
        //     //             Vue.delete(list, index)
        //     //     }
        //     // })
        //     // .subscribe()

        //     let { data, error } = await supabase.from(table).select('*').order('id')

        //     if(error)
        //         throw error

        //     for (let i = 0; i < data.length; i++) {
        //         Vue.set(list, i, data[i])
        //     }

        // }

        if(store) {
            store.registerModule('vueSupa', {
                state: {
                    $supaUser: null,
                    $tables: {},
                }, 
                mutations: {
                    supaUserStateChanged: (state, payload) => state.$supaUser = payload,
                    supaTableGet: (state, { name, data }) => Vue.set(state.$tables, name, data),
                    supaTableInsert: (state, { name, row }) => state.$tables[name].push(row),
                    supaTableDelete: (state, { name, id }) => {
                        let index = state.$tables[name].findIndex(q => q.id == id)
                        Vue.delete(state.$tables[name], index)
                    },
                    supaTableUpdate: (state, { name, id, row }) => {
                        let index = state.$tables[name].findIndex(q => q.id == id)
                        Vue.set(state.$tables[name], index, row)
                    },
                }, 
                // actions,
                getters: {
                    $supaUser: ({ $supaUser }) => $supaUser,
                    $supaTable: ({ $tables }) => (table => $tables[table]),
                    $supaTables: ({ $tables }) => $tables,
                }
            });
    
            (store => {
                supabase.auth.onAuthStateChange((event, session) => {
                    store.commit('supaUserStateChanged', event == 'SIGNED_IN' ? session.user : null)
                    tables.forEach(table => {
                        supabase.from(table.name || table)
                            .select(table.select || '*')
                            .order('id')
                            .then(({ data }) => {
                                console.log('>>>', data)
                                store.commit('supaTableGet', {
                                    name: table.name || table,
                                    data,
                                })
                            })
    
                        supabase.from(table.name || table)
                            .on('INSERT', ({ new: row }) => {
                                store.commit('supaTableInsert', {
                                    name: table.name || table,
                                    row,
                                })
                            })
                            .on('DELETE', ({ old: deleted }) => {
                                store.commit('supaTableDelete', {
                                    name: table.name || table,
                                    id: deleted.id,
                                })
                            })
                            .on('UPDATE', ({ new: row }) => {
                                store.commit('supaTableUpdate', {
                                    name: table.name || table,
                                    id: row.id,
                                    row,
                                })
                            })
                            // .on('*', ({ eventType, new: row, old: deleted }) => {
                            //     if(eventType == 'INSERT') {
                            //         store.commit('supaTableInsert', {
                            //             name: table.name || table,
                            //             row,
                            //         })
                            //     }
                            //     else if(eventType == 'DELETE') {
                            //         store.commit('supaTableDelete', {
                            //             name: table.name || table,
                            //             id: deleted.id,
                            //         })
                            //     }
                            //     else if(eventType == 'UPDATE') {
                            //         store.commit('supaTableUpdate', {
                            //             name: table.name || table,
                            //             id: row.id,
                            //             row,
                            //         })
                            //     }
                            // })
                            .subscribe()
                    })
                })
            })(store)
        
            Vue.mixin({
                computed: {
                    $supaUser() {
                        return this.$store.getters.$supaUser
                    },
                    $supaTable() {
                        return this.$store.getters.$supaTable
                    },
                    $supaTables() {
                        return this.$store.getters.$supaTables
                    },
                }
            })
        }
    }
}