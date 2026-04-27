import { defineStore } from 'pinia';
import { createAuthClient } from "better-auth/vue";

const authClient = createAuthClient();

export const useAuthStore = defineStore('useAuthStore', () => {
  // 给 session 一个明确的初始值，确保 SSR 和客户端一致
  const session = ref<Awaited<ReturnType<typeof authClient.useSession>> | null >(null);
  
  async function init(){
    const data  = await authClient.useSession(useFetch);
    session.value = data;
  }

  // 提供明确的默认值，避免 undefined
  const user = computed(()=> session.value?.data?.user ?? null);
  const loading = computed(()=> session.value?.isPending ?? true);

  async function signIn(){
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
      errorCallbackURL: '/error',
    })
  };

  async function signOut(){
    await authClient.signOut();
  }

  return{
    init,
    loading,
    signIn,
    signOut,
    user,
  }
})
