import Vue from 'vue'
import { createClient } from '@supabase/supabase-js'

const VuexSupa = ({ tables, supabaseUrl, supabaseKey }) => {
    const supabase = createClient(supabaseUrl, supabaseKey)
    return store => {
        let state = {
            // session: null,
            auth: null,
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
            // getters,
            getters: {
                db: state => (table => state[table]),
                auth: ({ auth }) => auth,
            },
        })
        console.log(tables, store, supabase)
    }
}

Vue.mixin({
    computed: {
        $db() {
            return this.$store.getters.db
        },
        $auth() {
            return this.$store.getters.auth
        }
    }
})

export {
    VuexSupa
}