```js
import { VuexSupa } from 'vue-supa'
```
```js
plugins: [
    VuexSupa({
        supabaseUrl: 'https://....supabase.co',
        supabaseKey: '...',
        tables: [
            { name: 'messages', select: '*, author:user_id(username)', orderBy: 'id' },
            'users',
        ]
    })
]
```