<template>
  <div class="w-screen h-screen flex items-center justify-center bg-primary">
    <div class="max-w-4xl border-4 border-t-0 border-[#FF5500] bg-[#FFFFFF] rounded-md">
      <div class="w-full flex">
        <button class="bg-[#FF5500] text-white p-2 w-1/2  border-[#FFFFFF] hover:bg-[#465362]" @click="this.login = true">Login</button>
        <button class="bg-[#FF5500] text-white p-2 w-1/2 hover:bg-[#465362]" @click="this.login = false">Register</button>
      </div>
      <h1 class="text-2xl m-12 mt-4 mb-4">{{login ? "Login" : "Register"}}</h1>
      <form class="m-12 mt-0" @submit.prevent="submit">
        <label for="username" class="mb-2">Username</label><br />
        <input type="text" id="username" placeholder="John Doe" class="p-2 border border-[#465362] mb-4 w-72" v-model="this.username">
        <p v-if="errorUsername" class="text-[#DB504C] w-72">{{ errorUsername }}</p>
        <br/>
        <label for="password" class="mb-2">Password</label><br />
        <input type="password" id="password" placeholder="******" class="p-2 border border-[#465362] mb-6 w-72" v-model="this.password">
        <p v-if="errorPassword" class="text-[#DB504C] w-72">{{ errorPassword }}</p>
        <br />
        <button type="submit" class="bg-[#FF5500] text-white p-2 rounded-md w-full hover:bg-[#465362]">{{login ? "Login" : "Register"}}</button>
        <p v-if="this.error" class="text-[#DB504C] w-72">{{this.error}}</p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "Login",
  data() {
    return {
      login: true,
      errorUsername: "",
      username: "",
      error: "",
      errorPassword: "",
      password: "",
    };
  },
  methods : {
    switchToConnected: function () {
      this.$store.commit('switchIsConnectedState', true)
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` + this.$cookies.get("session_id")).then((res) => {
        if (!(res.data == "not found" || res.data == "")) {
          this.$store.commit('addUserInformation', res.data)
        }
      })
    },
    submit() {
      if (this.username.length < 3)
        this.errorUsername = "Username must be at least 3 characters long";
      else
        this.errorUsername = "";
      if (this.password.length < 6)
        this.errorPassword = "Password must be at least 6 characters long";
      else
        this.errorPassword = "";
      if (this.errorPassword || this.errorUsername)
        return;
      console.log(this.username, this.password);
      if (this.login)
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/auth/login`, {username: this.username, password: this.password}).then(res => {
          this.switchToConnected();
          this.$router.push({name: 'home'});
        }).catch(() => {
          this.error = "Invalid username or password";
          this.password = "";
        })
      else
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/auth/register`, {username: this.username, password: this.password}).then(res => {
          if (res.data.error)
            this.error = res.data.error;
          else {
            this.switchToConnected();
            this.$router.push({name: 'home'});
          }
        }).catch((err) => {
          this.error = err.error
          this.password = "";
        })
    }
  }
}
</script>

<style scoped>

</style>