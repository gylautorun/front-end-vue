<template>
    <div class="card content-box">
        <a-form
            ref="formRef"
            :model="formState"
            v-bind="formItemLayout"
            :colon="false"
            :rules="rules"
            class="w-60"
        >
            <!-- 预约姓名 -->
            <a-form-item label="姓名" name="name">
                <a-input v-model:value="formState.name" placeholder="请输入姓名" />
            </a-form-item>
            <!-- 预约号码 -->
            <a-form-item label="号码" name="phone">
                <a-input v-model:value="formState.phone" placeholder="电话号码" />
            </a-form-item>
            <!-- 预约时间 -->
            <a-form-item label="时间" name="date">
                <a-date-picker v-model:value="formState.date" value-format="YYYY-MM-DD" />
            </a-form-item>
            <!-- 性别 -->
            <a-form-item label="性别" name="gender">
                <a-radio-group v-model:value="formState.gender">
                    <a-radio value="male">男</a-radio>
                    <a-radio value="female">女</a-radio>
                </a-radio-group>
            </a-form-item>
            <!-- 备注 -->
            <a-form-item label="备注" name="comment">
                <a-textarea v-model:value="formState.comment" placeholder="请输入备注" :rows="4" />
            </a-form-item>
            <!-- 上传组件 -->
            <a-form-item label="上传" name="upload">
                <a-upload
                    v-model:file-list="fileList"
                    name="file"
                    :before-upload="beforeUpload"
                    :show-upload-list="true"
                    :multiple="false"
                >
                    <a-button>
                        <upload-outlined></upload-outlined>
                        选择文件
                    </a-button>
                </a-upload>
            </a-form-item>

            <!-- 操作 -->
            <a-form-item :wrapper-col="{ span: 14, offset: 6 }" class="mt-20">
                <a-button type="primary" @click="onFinish" :loading="uploading">提交预约</a-button>
                <a-button class="ml-20" @click="() => formRef!.resetFields()">重置</a-button>
            </a-form-item>
        </a-form>
    </div>
</template>

<script setup lang="ts" name="uploadForm">
import { ref } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { FormInstance, UploadProps } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import Axios from '@/api'
import dayjs from 'dayjs'

/* 表单实例 */
const formRef = ref<FormInstance>()
/* 表单规则 */
const rules: Record<string, Rule[]> = {
    name: [{ type: 'string', required: true, message: '请输入姓名', trigger: ['change', 'blur'] }],
    phone: [{ type: 'string', required: true, message: '请输入号码', trigger: 'change' }],
    date: [
        {
            type: 'string' as const,
            required: true,
            message: '请选择预约时间',
            trigger: ['change', 'blur']
        }
    ],
    comment: [
        {
            type: 'string' as const,
            required: true,
            message: '请输入备注',
            trigger: ['change', 'blur']
        }
    ]
}
/* 表单布局 */
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 }
}
/* 表单状态 */
const formState = ref<Record<string, string>>({
    name: 'GanYanLin',
    phone: '12345678901',
    gender: 'male',
    date: dayjs().format('YYYY-MM-DD'),
    comment: 'test'
})

// 上传相关配置
const fileList = ref<any[]>([])
const uploading = ref<boolean>(false)

// 上传前的检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    // 直接保存文件对象
    fileList.value = [file]
    // 返回 false 阻止自动上传
    return false
}

/* 提交 */
const onFinish = async () => {
    try {
        // 验证表单数据
        const values = await formRef.value!.validateFields()

        // 检查是否有文件需要上传
        if (fileList.value.length === 0) {
            message.error('请选择要上传的文件')
            return
        }

        // 设置上传状态
        uploading.value = true

        // 检查是否有文件需要上传
        if (fileList.value.length === 0) {
            message.error('请选择要上传的文件')
            return
        }

        // 设置上传状态
        uploading.value = true

        // 创建 FormData 对象
        const formData = new FormData()

        // 添加文件到 FormData，确保字段名为 'file'
        const fileObj = fileList.value[0].originFileObj || fileList.value[0]
        formData.append('file', fileObj)

        // 添加表单数据到 FormData
        formData.append('name', values.name)
        formData.append('phone', values.phone)
        formData.append('date', values.date)
        formData.append('gender', values.gender)
        formData.append('comment', values.comment)

        // 发送上传请求
        const response = await Axios.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        // 重置上传状态
        uploading.value = false

        // 显示成功消息
        message.success('提交成功')
        console.log('上传响应:', response)
    } catch (errorInfo) {
        // 重置上传状态
        uploading.value = false
        message.error('提交失败: ' + (errorInfo as Error).message)
        console.error('上传错误:', errorInfo)
    }
}
</script>
