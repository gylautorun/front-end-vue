<template>
    <h2>表单验证</h2>
    <form @submit.prevent="onSubmit">
        <div>
            <label>姓名：</label>
            <input v-model="form.name" @blur="validateField('name')"/>
            <div v-if="errors.name" class="error">{{errors.name}}</div>
        </div>
        <div>
            <label>邮箱：</label>
            <input v-model="form.email" @blur="validateField('email')"/>
            <div v-if="errors.email" class="error">{{errors.email}}</div>
        </div>
        <button type="submit" :disabled="hasErrors">提交</button>
        <button type="button" @click="resetForm">重置</button>
	</form>
</template>
<script setup lang="ts" name="combinationForm">
	import {useFormValidation} from '@/hooks/use-form-validation';
	const initialValues = {name: '', email: ''};
	const validationRules = {
        name:[{validate: (value?: string) => !value, message: '姓名不能为空'}],
        email:[
            {validate: (value?: string) => !value, message: '邮箱不能为空'},
            {
                validate: (value: string) => {
                    const reg = /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;
                    return reg.test(value);
                },
                message: '邮箱格式不正确',
            },
        ],
    };
	const {form, errors, validateField, validateAll, hasErrors, resetForm} = useFormValidation(
        initialValues,
        validationRules
	);
	const onSubmit = () => {
        if(validateAll()){
            console.log('表单提交成功：', form);
        }
	};
</script>
<style scoped lang="scss">
    .error{
        color: red;
    }
</style>
