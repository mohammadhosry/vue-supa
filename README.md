```js
import { VuexSupa } from 'vue-supa'
```
```js
new Vuex.Store({
    state: { ... },
    mutations: { ... },
    actions: { ... },
    modules: { ... },
    plugins: [
        ...,
        VuexSupa({
            supabaseUrl: 'https://....supabase.co',
            supabaseKey: '...',
            tables: [
                { name: 'messages', select: '*, author:user_id(username)', orderBy: 'id' },
                'users',
            ]
        })
    ]
}
```