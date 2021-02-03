import { createClient } from '@supabase/supabase-js'

const arrayfy = payload => Array.isArray(payload) ? payload : [ payload ]

export default {
    install(Vue, { supabaseUrl, supabaseKey, store }) {

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
                get: async ({ select, orderby, dir }) => await table.select(select || '*').order(orderby || 'id', { ascending: dir != 'desc' }),
                insert: async payload => await table.insert(arrayfy(payload)),
                delete: async ids => await table.delete().in('id', arrayfy(ids)),
                update: async (ids, payload) => await table.update(payload).in('id', arrayfy(ids)),
            }
        }
        
        Vue.prototype.$supaAuth = supabase.auth

        Vue.prototype.$supaWatch = async (table, list /*, callbacks*/) => {

            supabase.from(table).on('*', ({ eventType, new: row, old: deleted }) => {
                if(eventType == 'INSERT')
                    list.push(row)
                else if(['DELETE', 'UPDATE'].includes(eventType)) {
                    let index = list.findIndex(q => q.id == (deleted?.id || row.id))
                    Vue.set(list, index, row)
                    if(deleted?.id)
                        Vue.delete(list, index)
                }
            })
            .subscribe()

            let { data, error } = await supabase.from(table).select('*').order('id')

            if(error)
                throw error

            for (let i = 0; i < data.length; i++) {
                Vue.set(list, i, data[i])
            }

        }

        if(store) {
            store.registerModule('vueSupa', {
                state: {
                    $supaUser: null,
                }, 
                mutations: {
                    supauserStateChanged: (state, payload) => state.$supaUser = payload
                }, 
                // actions,
                getters: {
                    $supaUser: ({ $supaUser }) => $supaUser,
                }
            });
    
            (store => {
                supabase.auth.onAuthStateChange((event, session) => {
                    store.commit('supauserStateChanged', event == 'SIGNED_IN' ? session.user : null)
                })
            })(store)
        
            Vue.mixin({
                computed: {
                    $supaUser() {
                        return this.$store.getters.$supaUser
                    }
                }
            })
        }
    }
}