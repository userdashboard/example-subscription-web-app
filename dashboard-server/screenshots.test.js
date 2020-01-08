const path = require('path')
const childProcess = require('child_process')
global.applicationPath = __dirname
/* eslint-env mocha */
const fs = require('fs')
const convertingHTML = fs.readFileSync('../readme.md').toString()
let applicationServer
const TestHelper = require('@userdashboard/dashboard/test-helper.js')

before((callback) => {
  applicationServer = childProcess.execFile('../application-server/start-dev.sh')
  return callback()
})

after((callback) => {
  if (applicationServer) {
    applicationServer.stdin.pause()
    applicationServer.kill()
  }
  return callback()
})

describe('hastebin-web-app-with-organizations', () => {
  it('user 1 registers (screenshots)', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.get()
  })

  it('user 1 creates post', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 1 creates organization', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 1 creates invitation', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 2 creates account', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 2 accepts invitation', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 2 creates shared post', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })

  it('user 1 accesses shared post', async () => {
    // user1 registers, creates a post, then creates an organization and an invitation
    const req = TestHelper.createRequest('/')
    req.filename = 'hastebin-web-app-with-organizations'
    req.screenshots = [
      { save: true },
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        }
      }
    ]
    const page = await req.post()
  })
})




//       {
//         fill: '#something',
//         body: {
//           'post-textarea': convertingHTML,
//           customid: 'screenshots',
//           language: 'HTML'
//         }
//       },
//       { hover: '#account-menu-container' },
//       { click: '/account/organizations' },
//       { click: '/account/organizations/create-organization' },
//       {
//         fill: '#submit-form',
//         body: {
//           name: 'Developers',
//           email: 'organization@email.com'
//         }
//       },
//       { click: '/account/organizations/create-invitation' },
//       {
//         fill: '#submit-form',
//         body: {
//           code: 'secret'
//         }
//       }
//     ]
//     await req.get()
//     //
//     const invitations = await global.api.administrator.organizations.Invitations.get({})
//     console.log(invitations)
//     const invitationid = invitations[0].invitationid
//     // user2 registers and uses the invitation to join the organization
//     const req3 = TestHelper.createRequest('/')
//     req3.filename = 'hastebin-web-app-with-organizations'
//     req3.screenshots = [
//       { click: '/account/register' },
//       { 
//         fill: '#submit-form', 
//         body: {
//           username: 'SecondUser',
//           password: '87654321',
//           confirm: '87654321'
//         }
//       },
//       { hover: '#account-menu-container' },
//       { click: '/account/organizations' },
//       { click: '/account/organizations/accept-invitation' },
//       {
//         fill: '#submit-form',
//         body: {
//           name: 'Workplace',
//           email: 'person@workplace',
//           invitationid: invitationid,
//           code: 'secret'
//         }
//       },
//       { click: '/' },
//       {
//         fill: '#submit-form',
//         body: {
//           'post-textarea': convertingJS,
//           customid: 'screenshots.js',
//           language: 'JavaScript',
//           organization: 'Workplace'
//         }
//       }
//     ]
//     // user1 opens the shared post
//     const req4 = TestHelper.createRequest('/home')
//     req4.filename = 'hastebin-web-app-with-organizations'
//     req4.screenshots = [
//       { click: '/' },
//       { click: '/organization-posts' },
//       { click: 'screenshots.js' }
//     ]
//   })
// })
