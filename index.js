import Vue from 'vue'
import { createClient } from '@supabase/supabase-js'

const arrayfy = payload => Array.isArray(payload) ? payload : [ payload ]

const VuexSupa = ({ tables, supabaseUrl, supabaseKey }) => {
    const supabase = createClient(supabaseUrl, supabaseKey)
    return store => {
        let state = {
            // session: null,
            auth: null,
            supabase,
        }
        supabase.auth.onAuthStateChange((event, session) => {
            // store.commit('dbSessionUpdate', session)
            store.commit('dbAuthUpdate', event == 'SIGNED_IN' ? session.user : null)
        })
        // let getters = {}
        tables.forEach(table => {
            let name = table.name || table
            state[name] = []
            // getters[name] = (state) => state[name]
            supabase.from(name)
                .select(table.select || '*')
                .order(table.orderBy || 'id')
                .then(({ data }) => store.commit('dbTableSelect', { name, data }))

            supabase.from(name)
                .on('INSERT', ({ new: row }) => store.commit('dbTableInsert', { name, row }))
                .on('UPDATE', ({ new: row }) => store.commit('dbTableUpdate', { name, row }))
                .on('DELETE', ({ old: { id } }) => store.commit('dbTableDelete', { name, id }))
                .subscribe()
        });
        store.registerModule('db', { 
            // namespaced: true,
            state,
            mutations: {
                // dbSessionUpdate: (state, payload) => state.session = payload,
                dbAuthUpdate: (state, payload) => state.auth = payload,
                dbTableSelect: (state, { name, data }) => Vue.set(state, name, data),
                dbTableInsert: (state, { name, row }) => state[name].push(row),
                dbTableDelete: (state, { name, id }) => {
                    let index = state[name].findIndex(q => q.id == id)
                    Vue.delete(state[name], index)
                },
                dbTableUpdate: (state, { name, row }) => {
                    let index = state[name].findIndex(q => q.id == row.id)
                    Vue.set(state[name], index, row)
                },
            },
            actions: {
                dbInsert: async ({ state }, { name, payload }) => await state.supabase.from(name).insert(arrayfy(payload)),
                dbDelete: async ({ state }, { name, ids }) => await state.supabase.from(name).delete().in('id', arrayfy(ids)),
                dbUpdate: async ({ state }, { name, ids, payload }) => await state.supabase.from(name).update(payload).in('id', arrayfy(ids)),
            },
            // getters,
            getters: {
                supabase: state => state.supabase,
                db: state => (table => state[table]),
                // db: state => ((table, action = null) => !action ? state[table] : ({
                //     insert: async payload => await supabase.from(table).insert(arrayfy(payload)),
                //     delete: async ids => await supabase.from(table).delete().in('id', arrayfy(ids)),
                //     update: async (ids, payload) => await supabase.from(table).update(payload).in('id', arrayfy(ids)),
                // })[action]),
                auth: ({ auth }) => auth,
            },
        })
        // console.log(tables, store, supabase)
    }
}

Vue.mixin({
    computed: {
        $db() {
            return this.$store.getters.db
        },
        // $dbAction: (name) => {
        //     let table = this.$store.getters.supabase.from(name)
        //     return {
        //         insert: async payload => await table.insert(arrayfy(payload)),
        //         delete: async ids => await table.delete().in('id', arrayfy(ids)),
        //         update: async (ids, payload) => await table.update(payload).in('id', arrayfy(ids)),
        //     }
        // },
        $auth() {
            return this.$store.getters.auth
        }
    },
    methods: {
        $dbAction(name) {
            return {
                insert: payload => this.$store.dispatch('dbInsert', { name, payload }),
                remove: ids => this.$store.dispatch('dbDelete', { name, ids }),
                update: (ids, payload) => this.$store.dispatch('dbUpdate', { name, ids, payload }),
            }
            // let table = this.$store.getters.supabase.from(name)
            // return {
            //     insert: async payload => await table.insert(arrayfy(payload)),
            //     delete: async ids => await table.delete().in('id', arrayfy(ids)),
            //     update: async (ids, payload) => await table.update(payload).in('id', arrayfy(ids)),
            // }
        },
    }
})

export {
    VuexSupa
}