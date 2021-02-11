## Improt Vuex plugin

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

## Usage

```js
this.$db('messages') // realtime messages
this.$auth // for retrieving the authenticated user
```

```vue
<div v-if="$auth.check">
    <h4>Hello, {{ $auth.email }}</h4>
    <button @click="$auth.signOut()" class="btn btn-sm btn-danger">Sign out</button>
    <ul>
        <li v-for="todo in $db('todos')" :key="todo.id">
            <label class="form-check-label">
                <input 
                    class="form-check-input"
                    type="checkbox"
                    :checked="todo.is_complete"
                    @change="$dbAction('todos').update(todo.id, { is_complete: !todo.is_complete })">
                <span :style="todo.is_complete ? 'text-decoration: line-through' : ''">{{ todo.task }}</span>
            </label>
            <button class="btn btn-sm btn-danger ml-2" @click="$dbAction('todos').remove(todo.id)">X</button>
        </li>
    </ul>
</div>
```