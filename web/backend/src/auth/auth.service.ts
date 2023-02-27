import { Injectable } from '@nestjs/common';
import { DbService } from 'global/services/db.service';
import { GlobalService } from 'global/services/global.service';
import axios from 'axios';
import * as moment from "moment-timezone";
import {knex} from "config.knex";
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
	constructor(private dbService: DbService, private globalService: GlobalService) {}

	async validateUser(username: string, password): Promise<any> {
		return await knex('user').where("username", username).select().first().then(async (row) => {
			const bcryptResponse = await bcrypt.compare(password, row.password)
			console.log("BCRYPT: ", row.password, password, bcryptResponse)
			if (row && bcrypt.compare(row.password, password)) {
				const { password, ...result } = row;
				return result;
			}
			return null;
		}).catch(() => {
			return null;
		})
	}

	async alreadyUserByUsername(username: string): Promise<boolean> {
		return await knex('user').where("username", username).select().first().then((row) => {
			return (row)
		}).catch(() => {
			return null;
		})
	}

	async register(body: any) : Promise<any> {

		// const passwordInPlaintext = '12345678';
		// const hash = await bcrypt.hash(passwordInPlaintext, 10);

		// const isPasswordMatching = await bcrypt.compare(passwordInPlaintext, hash);
		// console.log(isPasswordMatching); // true
		const isAlreadyUser = await this.alreadyUserByUsername(body.username);
		const hash = await bcrypt.hash(body.password, 10);
		if (isAlreadyUser)
			return { error: "User already exist" };
		const newUser = await knex("user").returning(['username', 'id']).insert({
			'username': body.username,
			'password': hash,
			'created_at': this.globalService.dateGenerator()
		});
		console.log(newUser[0]);
		return newUser[0];
	}
	async getInfoUser(token: string) {
		let headers = {
			headers: {
				'Authorization': 'Bearer ' + token + ""
			}
		}

		return await axios.get("https://api.intra.42.fr/v2/me", headers).then((res) => {
			return res.data
		}).catch(e => {
			return undefined
		})
	}
	async getToken(code: string) : Promise<string>{
		let data = {
			'grant_type': 'authorization_code',
			'client_id': process.env.UID + "",
			'client_secret': process.env.SECRET + "",
			'code': code,
			'redirect_uri': `http://${process.env.BASE_URL}/login`
		}
		return await axios.post("https://api.intra.42.fr/oauth/token", data).then((res) => {
			return res.data.access_token
		}).catch(e => {
			return undefined
		})
	}

	async createCookieById(id: number, res) {
		let cookie = this.globalService.generateToken()
		let date = 	new Date(new Date().getTime()+ 2 * 60 * 60 * 1000)
		let newdate = moment(date).format("YYYY-MM-DD HH:mm:ss");

		res.header("Access-Control-Allow-Origin", `http://${process.env.BASE_URL}`);
		res.cookie('session_id', cookie, {
			expires: date,
			sameSite: 'strict',
			httpOnly: false,
		});

		await this.dbService.deleteOperator("session", "expired", "<", this.globalService.dateGenerator())
		this.dbService.insert("session", {
			'sid': cookie,
			'user_id': id,
			'expired': newdate,
		}).then(() => {})
		.catch(() => {	
			console.log('Error: Session');
		})
	}

	async isConnected(req) : Promise<boolean> {
		await this.dbService.deleteOperator("session", "expired", "<", this.globalService.dateGenerator())
		return await this.dbService.selectAll('session', {
			'sid': req.cookies.session_id
		}).then((res) => {
			return res[0] != null;
		}).catch(() => {
			return false;
		})
	}

	addHeaderRes(res) {
		res.header("Access-Control-Allow-Origin", `http://${process.env.BASE_URL}`);
		res.header("Access-Control-Allow-Credentials", true);
		// res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
		// res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');

	}

}
