<template>
  <div class="login">
    <a-form
      :model="formState"
      name="basic"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item
        label="姓名"
        name="name"
        :rules="[{ required: true, message: '请输入姓名' }]"
      >
        <a-input v-model:value="formState.name" />
      </a-form-item>

      <a-form-item
        label="密码"
        name="password"
        :rules="[{ required: true, message: '请输入密码' }]"
      >
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
        <a-button type="primary" html-type="submit">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue';
  import { useUserStore } from '@/stores/modules/user';
import { useRouter } from 'vue-router';
import { UserState } from '@/stores/type';
  const router = useRouter();
  const {
    userInfo: formState,
    setToken,
    setUserInfo,
  } = useUserStore();
  const onFinish = (values: UserState['userInfo']) => {
    setToken(Math.random().toString(36).substr(2));
    setUserInfo(values);
    router.push('/home');
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
</script>

<style scoped lang="scss">
  .login {
    margin: 50px auto;
    width: 50%;
  }
</style>
