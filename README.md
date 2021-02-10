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
<ul v-if="$auth.check">
    <li v-for="todo in $db('todos')" :key="todo.id">
        <label class="form-check-label">
            <input 
                class="form-check-input"
                type="checkbox"
                :checked="todo.is_complete"
                @change="$dbAction('todos').update(todo.id, { is_complete: !todo.is_complete })">
            <span :style="todo.is_complete ? 'text-decoration: line-through' : ''">{{ todo.task }}</span>
        </label>
        <button @click="$dbAction('todos').remove(todo.id)" class="btn btn-sm btn-danger ml-2">X</button>
    </li>
</ul>
```