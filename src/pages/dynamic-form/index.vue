
<template>
    <form @submit.prevent="handleSubmit">
        <div v-for="(field, index) in fields" :key="index">
            <label :for="field.name">{{ field.label }}</label>
            <input :type="field.type" :name="field.name" v-model="formData[field.name]" />
        </div>
        <div>
            <input v-model="newField.label" placeholder="字段标签" />
            <select v-model="newField.type">
                <option value="text">文本</option>
                <option value="email">邮箱</option>
                <option value="password">密码</option>
                <option value="number">数字</option>
            </select>
            <a-button type="primary" @click="addField">修改</a-button>
        </div>
        <button class="button" type="submit">提交</button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const newField = ref({ label: '', type: 'text' });
const fields = ref([
    { name: 'username', label: '用户名', type: 'text' },
    { name: 'email', label: '邮箱', type: 'email' },
    { name: 'password', label: '密码', type: 'password' }
]);

const formData = ref<Record<string, unknown>>({});
initializeFormData();

fields.value.forEach(field => {
    formData.value[field.name] = '';
});

const handleSubmit = () => {
    console.log(formData.value);
};

const addField = () => {
    const fieldName = generateFieldName();
    const newFieldData = {
        name: fieldName,
        label: newField.value.label || `字段${fields.value.length + 1}`,
        type: newField.value.type
    };
    fields.value.push(newFieldData);
    formData.value[fieldName] = '';
    newField.value.label = '';
};
function initializeFormData() {
    fields.value.forEach(field => {
        formData.value[field.name] = '';
    });
}

function generateFieldName() {
    return `field${fields.value.length + 1}`;
}
</script>

<style scoped lang="scss">
form {
    display: flex;
    flex-direction: column;
}

label {
    margin: 8px 0 4px;
}

input {
    margin-bottom: 16px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.button {
    padding: 10px 20px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.button:hover {
    background-color: #369970;
}
</style>