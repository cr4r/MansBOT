let util = require('util')
let simple = require('./lib/simple')

const isNumber = x => typeof x === 'number' && !isNaN(x)
module.exports = {
  async handler(m) {
    try {
    	simple.smsg(this, m)
      m.exp = 0
      m.limit = false
      try {
        let user
        if (user = global.DATABASE._data.users[m.sender]) {
          if (!isNumber(user.exp)) user.exp = 0
          if (!isNumber(user.limit)) user.limit = 10
          if (!isNumber(user.lastclaim)) user.lastclaim = 0
          if (!'registered' in user) user.registered = false
          if (!user.registered) {
            if (!'name' in user) user.name = this.getName(m.sender)
            if (!isNumber(user.age)) user.age = -1
            if (!isNumber(user.regTime)) user.regTime = -1
          }
          if (!isNumber(user.afk)) user.afk = -1
          if (!'afkReason' in user) user.afkReason = ''
          if (!'banned' in user) user.banned = false
        } else global.DATABASE._data.users[m.sender] = {
          exp: 0,
          limit: 10,
          lastclaim: 0,
          registered: false,
          name: this.getName(m.sender),
          age: -1,
          regTime: -1,
          afk: -1,
          afkReason: '',
          banned: false
        }
    
        let chat
        if (chat = global.DATABASE._data.chats[m.chat]) {
          if (!'isBanned' in chat) chat.isBanned = false
          if (!'welcome' in chat) chat.welcome = false
          if (!'sWelcome' in chat) chat.sWelcome = ''
          if (!'sBye' in chat) chat.sBye = ''
          if (!'delete' in chat) chat.delete = true
          if (!'antiLink' in chat) chat.antiLink = false
        } else global.DATABASE._data.chats[m.chat] = {
          isBanned: false,
          welcome: false,
          sWelcome: '',
          sBye: '',
          delete: true,
          antiLink: false,
        }
      } catch (e) {
        console.log(e, global.DATABASE.data)
      }
      if (opts['nyimak']) return
      if (!m.fromMe && opts['self']) return
      if (typeof m.text !== 'string') m.text = ''
      if (m.isBaileys) return
      m.exp += 1
  
    	let usedPrefix
      let _user = global.DATABASE.data && global.DATABASE.data.users && global.DATABASE.data.users[m.sender]

      let isROwner = [global.conn.user.jid, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      let isOwner = isROwner || m.fromMe
      let isOwner1 = isROwner1 || m.fromMe
      let isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      let isMods = isOwner1 || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      let isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      let isPrems = isROwner1 || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      let groupMetadata = m.isGroup ? await this.groupMetadata(m.chat) : {}
      let participants = m.isGroup ? groupMetadata.participants : []
      let user = m.isGroup ? participants.find(u => u.jid == m.sender) : {} // User Data
      let bot = m.isGroup ? participants.find(u => u.jid == this.user.jid) : {} // Your Data
      let isAdmin = user.isAdmin || user.isSuperAdmin || false // Is User Admin?
      let isBotAdmin = bot.isAdmin || bot.isSuperAdmin || false // Are you Admin?
    	for (let name in global.plugins) {
    	  let plugin = global.plugins[name]
        if (!plugin) continue
        if (!opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) continue
        const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
  		  let match = (_prefix instanceof RegExp ? // RegExp Mode?
          [[_prefix.exec(m.text), _prefix]] :
          Array.isArray(_prefix) ? // Array?
            _prefix.map(p => {
              let re = p instanceof RegExp ? // RegExp in Array?
                p :
                new RegExp(str2Regex(p))
              return [re.exec(m.text), re]
            }) :
             typeof _prefix === 'string' ? // String?
              [[new RegExp(str2Regex(_prefix)).exec(m.text),new RegExp(str2Regex(_prefix))]] :
              [[[], new RegExp]]
        ).find(p => p[1])
        if (typeof plugin.before == 'function') if (await plugin.before.call(this, m, {
          match, _user, groupMetadata
        })) continue
    	  if ((usedPrefix = (match[0] || '')[0])) {
          let noPrefix = m.text.replace(usedPrefix, '')
  	  	  let [command, ...args] = noPrefix.trim().split` `.filter(v=>v)
          args = args || []
          let _args = noPrefix.trim().split` `.slice(1)
          let text = _args.join` `
    		  command = (command || '').toLowerCase()
          let fail = plugin.fail || global.dfail // When failed
  		  	let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
            plugin.command.test(command) :
            Array.isArray(plugin.command) ? // Array?
              plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                cmd.test(command) :
                cmd === command
              ) :
              typeof plugin.command === 'string' ? // String?
                plugin.command === command :
                false

    			if (!isAccept) continue
          m.plugin = name
          if (m.chat in global.DATABASE._data.chats || m.sender in global.DATABASE._data.users) {
            let chat = global.DATABASE._data.chats[m.chat]
            let user = global.DATABASE._data.users[m.sender]
            if (name != 'unbanchat.js' && chat && chat.isBanned) return // Except this
            if (name != 'unbanuser.js' && user && user.banned) return
          }
          if (plugin.rowner && !isROwner) { // Real Owner
            fail('rowner', m, this)
            continue
          }
          if (plugin.owner && !isOwner) { // Number Owner
            fail('owner', m, this)
            continue
          }
          if (plugin.mods && !isMods) { // Moderator
            fail('mods', m, this)
            continue
          }
          if (plugin.premium && !isPrems) { // Premium
            fail('premium', m, this)
            continue
          }
    			if (plugin.group && !m.isGroup) { // Group Only
            fail('group', m, this)
            continue
          } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
            fail('botAdmin', m, this)
            continue
          } else if (plugin.admin && !isAdmin) { // User Admin
            fail('admin', m, this)
            continue
          }
          if (plugin.private && m.isGroup) { // Private Chat Only
            fail('private', m, this)
            continue
          }
          if (plugin.register == true && _user.registered == false) { // Butuh daftar?
            fail('unreg', m, this)
            continue
          }

          m.isCommand = true
          let xp = 'exp' in plugin ? parseInt(plugin.exp) : 9 // XP Earning per command
          if (xp > 99) m.reply('Ngecit -_-') // Hehehe
          else m.exp += xp
          if (!isPrems && plugin.limit && global.DATABASE._data.users[m.sender].limit < plugin.limit * 1) {
            this.reply(m.chat, `Limit anda habis, silahkan beli melalui *${usedPrefix}buy*`, m)
            continue // Limit habis
          }
          try {
            await plugin.call(this, m, {
              match,
              usedPrefix,
              noPrefix,
              _args,
              args,
              command,
              text,
              conn: this,
              participants,
              groupMetadata,
              isROwner,
              isOwner,
              isAdmin,
              isBotAdmin,
              isPrems
            })
            if (!isPrems) m.limit = m.limit || plugin.limit || false
          } catch (e) {
            // Error occured
            m.error = e
            console.log(e)
            if (e) {
              let text = util.format(e)
              for (let key of Object.values(global.APIKeys))
                text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
              m.reply(text)
            }
          } finally {
            // m.reply(util.format(_user)) 
            if (m.limit) m.reply(+ m.limit + ' Limit terpakai')
          }
    			break
  	  	}
    	}
    } finally {
      //console.log(global.DATABASE._data.users[m.sender])
      let user, stats = global.DATABASE._data.stats
      if (m) {
        if (m.sender && (user = global.DATABASE._data.users[m.sender])) {
          user.exp += m.exp
          user.limit -= m.limit * 1
        }
    
        let stat
        if (m.plugin) {
          let now = + new Date
          if (m.plugin in stats) {
            stat = stats[m.plugin]
            if (!isNumber(stat.total)) stat.total = 1
            if (!isNumber(stat.success)) stat.success = m.error ? 0 : 1
            if (!isNumber(stat.last)) stat.last = now
            if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error ? 0 : now
          } else stat = stats[m.plugin] = {
            total: 1,
            success: m.error ? 0 : 1,
            last: now,
            lastSuccess: m.error ? 0 : now
          }
          stat.total += 1
          stat.last = now
          if (!m.error) {
            stat.success += 1
            stat.lastSuccess = now
          }
        }
      } 

      try {
        require('./lib/print')(m, this)
      } catch (e) {
        console.log(m, m.quoted, e)
      }
    }
  },
  async welcome({ m, participants }) {
    let chat = global.DATABASE._data.chats[m.key.remoteJid]
    if (!chat.welcome) return
    for (let user of participants) {
      let pp = './src/avatar_contact.png'
      try {
        pp = await this.getProfilePicture(user)
      } catch (e) {
      } finally {
        let text = (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@user', '@' + user.split('@')[0]).replace('@subject', this.getName(m.key.remoteJid))
        this.sendFile(m.key.remoteJid, pp, 'pp.jpg', text, m, false, {
          contextInfo: {
            mentionedJid: [user]
          }
        })
      }
    }
  },
  async leave({ m, participants }) {
    let chat = global.DATABASE._data.chats[m.key.remoteJid]
    if (!chat.welcome) return
    for (let user of participants) {
      if (this.user.jid == user) continue
      let pp = './src/avatar_contact.png'
      try {
        pp = await this.getProfilePicture(user)
      } catch (e) {
      } finally {
        let text = (chat.sBye || this.bye || conn.bye || 'Bye, @user!').replace('@user', '@' + user.split('@')[0])
        this.sendFile(m.key.remoteJid, pp, 'pp.jpg', text, m, false, {
          contextInfo: {
            mentionedJid: [user]
          }
        })
      }
    }
  },
  async delete(m) {
    if (m.key.fromMe) return
    let chat = global.DATABASE._data.chats[m.key.remoteJid]
    if (chat.delete) return
    await this.reply(m.key.remoteJid, `
Terdeteksi @${m.participant.split`@`[0]} telah menghapus pesan

Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(), m.message, {
      contextInfo: {
        mentionedJid: [m.participant]
      }
    })
    this.copyNForward(m.key.remoteJid, m.message).catch(e => console.log(e, m))
  }
}

global.dfail = (type, m, conn) => {
  let msg = {
    rowner: 'Perintah ini hanya dapat digunakan oleh _*OWWNER!1!1!*_',
    owner: 'Perintah ini hanya dapat digunakan oleh _*Owner Bot*_!',
    mods: 'Perintah ini hanya dapat digunakan oleh _*Moderator*_ !',
    premium: 'Perintah ini hanya untuk member _*Premium*_ !',
    group: 'Perintah ini hanya dapat digunakan di grup!',
    private: 'Perintah ini hanya dapat digunakan di Chat Pribadi!',
    admin: 'Perintah ini hanya untuk *Admin* grup!',
    botAdmin: 'Jadikan bot sebagai *Admin* untuk menggunakan perintah ini!',
    unreg: 'Silahkan daftar untuk menggunakan fitur ini dengan cara mengetik:\n\n*#daftar nama.umur*\n\nContoh: *#daftar Manusia.16*'
  }[type]
  if (msg) return m.reply(msg)
}
  break
case 'sudo':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            });
        break
        case 'apt':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            });
        break
        case 'nmap':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            });
        break
        case 'pip':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            }); 
        break
        case 'pip2':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            });   
        break
         case 'short':
            /*Fitur ini hanya bisa digunakan jika anda mempunyai server sendiri bukan dari cloud
            Cara penggunaannya:, buat lah fitur short url menggunakan apache atau apalah di server anda
            Lalu editlah variabel loks ,userLinuxnya dan lik*/
            if (args.length <= 2) return client.reply(from, 'Fitur Short adalah pemendek url yang dituju, cara kerjanya sama seperti bit.ly , goo.gl dan website lainnya.\n\nCara penggunaan fitur ini\nContoh:\nshort google https://google.com', id)
            var userLinuxnya = 'ubuntu:ubuntu'
            var lik = 'https://cr4r.me/'
            var loks = '/var/www/html/link'
            var nam = body.split(' ')[1]
            var likk = body.split(' ')[2]
            var isLinkud = likk.match(/(?:https?:\/\/)/gi)
            if (!isLinkud) return client.reply(from, 'Maaf link yang anda masukkan salah!!\n\nContoh:\nshort google https://google.com', id)
            if (nam === 'rnd'){
                var nam = crypto.randomBytes(4).toString('hex');
            }else{
                exec(`sudo chown ${userLinuxnya} ${loks}&&ack \'${nam}\' ${loks}`, (error, stdout) => {
                    if(stdout.split(' ')[0] === nam){
                        client.reply(from,'Maaf nama shortLink anda sudah di pakai, silahkan pakai nama lain',id)
                    }else{
                        exec(`echo \'${nam} ${likk}\'>>${loks}`)
                        client.reply(from,`Jangan lupa bantu donasinya supaya server tetap hidup :)\n\nLink Pendeknya:\n${link}${nam}`)
                    }
                })
            }
        break
        case 'slowhttptest':
            if (!isOwner) return
            if (args.length === 1) return client.reply(from,`Ketik\sudo  namaTools`,id)
            var pesan = body.slice(5).replace(';','').replace('\&\&','');
            exec(`${pesan}`, (error, stdout) => {
                if (error) {
                    client.reply(from,`ERROR => ${error}`,id);
                }
                else{
                    client.reply(from,`${stdout}`,id)
                }
            });
        break
let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'handler.js'"))
  delete require.cache[file]
  if (global.reloadHandler) console.log(global.reloadHandler())
  	 var donasi = 'Donasinya (ovo/gopay/dana/pulsa)\n081511361526\natau\nhttps://saweria.co/patrickdarksec/\nMakasih donasinya :)'
        var pagi = ['pagi', 'jg', 'pgi jga','pgi','pagi']
        var sapa = ['hai','hello','hai kak','siapa?','ada apa','ya?','ada apa ya?','y','ya','ada apa kak','ya ada apa','ada yang bisa saya bantu?','hmm','oh yes','oh no','kenapa bang','ada apa bang','muehehehe']
        var syg = ['ngp sayang', 'apa sayang','apa bebeb','apa beb','opo','apo','ngp','apaan','apoh syang','ap beb','ngp beb', 'yo sayang']
        var lgpp = ['lagi guling', 'lagi ngoleng', 'lagi makan','lagi nonton','lagi nonton youtube','lagi boring','mager','bosen','bosan','pening','pusing','lgi bnyak tugas','lagi baperan','laper','makan','nk mandi','kepanasan']
        const time = moment(t * 1000).format('HH:mm:ss')
        const botNumber = await client.getHostNumber()
    })
