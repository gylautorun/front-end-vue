import {defineComponent} from 'vue'
import Horizontal from './sidebar/horizontal.vue'

export const LayoutHeader = defineComponent({
    setup(){
        return ()=>{
            return <div class="fixed-header"><Horizontal/></div>
        }
    }
})
