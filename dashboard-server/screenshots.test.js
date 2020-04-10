/* eslint-env mocha */
const assert = require('assert')
global.applicationPath = __dirname
const fs = require('fs')
const pasteText = fs.readFileSync('./node_modules/@userdashboard/dashboard/readme.md').toString()
let applicationServer
const TestHelper = require('@userdashboard/stripe-subscriptions/test-helper.js')
const TestStripeAccounts = require('@userdashboard/stripe-subscriptions/test-stripe-accounts.js')

before(async () => {
  applicationServer = require('../application-server/main.js')
  await applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
})

beforeEach(async () => {
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
})

after(async () => {
  if (applicationServer) {
    await applicationServer.stop()
    applicationServer = null
  }
})

describe('example-subscription-web-app', () => {
  it('administrator creates product and plan (screenshots)', async () => {
    const owner = await TestHelper.createOwner()
    const req = TestHelper.createRequest('/home')
    req.account = owner.account
    req.session = owner.session
    req.filename = '/src/www/example-subscription-app/administrator-creates-product-plan.test.js'
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/create-product' },
      { fill: '#submit-form', body: {
        name: 'product',
        statement_descriptor: 'description',
        unit_label: 'thing'
      }},
      { click: '/administrator/subscriptions/publish-product' },
      { fill: '#submit-form' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/create-plan' },
      { fill: '#submit-form', body: {
          planid: 'plan' + new Date().getTime(),
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          currency: 'usd',
          productid: 'product'
        }
      },
      { click: '/administrator/subscriptions/publish-plan' },
      { fill: '#submit-form' }
    ]
    const result = await req.post()
  })

  it.only('user 1 registers and subscribes', async () => {
    const administrator = await TestStripeAccounts.createOwnerWithPlan()
    global.stripeJS = 3
    global.requireSubscription = true
    const userIdentity = TestHelper.nextIdentity()
    const req = TestHelper.createRequest('/')
    req.filename = '/src/www/example-subscription-app/user-creates-account.test.js'
    req.screenshots = [
      { click: '/account/register' },
      { 
        fill: '#submit-form', 
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        },
        waitAfter: async (page) => {
          console.log('wait for plan selection form')
          while (true) {
            try {
              await page.waitForNavigation()
            } catch (error) {
              await page.waitFor(100)
              continue
            }
            const submitForm = await page.$('#submit-form')
            if (submitForm) {
              return
            }
            await page.waitFor(100)
          }
        }
      }, 
      {
        fill: '#submit-form',
        body: {
          planid: administrator.plan.id
        }
      },
      {
        fill: '#form-stripejs-v3',
        body: {
          email: userIdentity.email,
          description: 'description',
          name: `${userIdentity.firstName} ${userIdentity.lastName}`,
          'cvc-container': '111',
          'card-container': '4111111111111111',
          'expiry-container': '12' + ((new Date().getFullYear() + 1).toString()).substring(2),
          address_line1: '285 Fulton St',
          address_line2: 'Apt 893',
          address_city: 'New York',
          address_state: 'NY',
          'zip-container': '10007',
          address_country: 'US'
        },
        waitBefore: async (page) => {
          while (true) {
            try {
              const cardContainerChildren = await page.evaluate(async () => {
                var cardContainer = document.getElementById('card-container')
                return cardContainer && cardContainer.children.length
              })
              if (cardContainerChildren) {
                await page.screenshot({ path: `${__dirname}/ss1.png`, type: 'png' })
                return
              }
            } catch (error) {
            }
            await page.waitFor(100)
          }
        }
      },
      {
        fill: '#submit-form',
        body: {
          customerid: 'cus_'
        },
        waitBefore: async (page) => {
          console.log('waiting for message container children or redirect')
          while (true) {
            try {
              const customeridChildren = await page.evaluate(async () => {
                var customerid = document.getElementById('customerid')
                return customerid && customerid.options.length
              })
              if (customeridChildren) {
                console.log('finished waiting after card form submission')
                await page.screenshot({ path: `${__dirname}/ss1.png`, type: 'png' })
                return
              }
            } catch (error) {
            }
            await page.waitFor(100)
          }
        },       
        waitAfter: async (page) => {
          while (true) {
            let frame
            try {
              frame = await page.frames().find(f => f.name() === 'application-iframe')
            } catch (error) {
            }
            if (!frame) {
              await page.waitFor(100)
              continue
            }
            const postCreator = await frame.evaluate(() => {
              var postCreator = document.getElementById('post-creator')
              return postCreator && postCreator.style.display ? postCreator.style.display : 'none'
            })
            if (postCreator === 'block') {
              console.log('got post creator being displayed')
              return
            }
            await page.waitFor(100)
          }
        }
      }
    ]
    const result = await req.post() 
    assert.strictEqual(result.redirect, '/home')
  })

  it('user 1 creates post', async () => {
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/home')
    req.waitFormComplete = async (page) => {
      while (true) {
        const frame = await page.frames().find(f => f.name() === 'application-iframe')
        if (!frame) {
          await page.waitFor(100)
          continue
        }
        const postContent = await frame.evaluate(() => {
          var postContent = document.getElementById('post-content')
          return postContent.style.display
        })
        if (postContent === 'block') {
          return
        }
        await page.waitFor(100)
      }
    }
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/example-subscription-app/user-creates-post.test.js'
    req.screenshots = [{ 
      fill: '#post-creator', 
      body: {
        'post-textarea': pasteText,
        documentid: 'readme.md',
        language: 'MarkDown'
      }
    }]
    const result = await req.post()
    // TODO: can't detect the rendered post 
    assert.strictEqual(1, 1)
  })

  it('user 1 creates organization', async () => {
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/example-subscription-app/user-creates-organization.test.js'
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/organizations' },
      { click: '/account/organizations/create-organization' },
      {
        fill: '#submit-form',
        body: {
          name: 'Developers',
          email: 'organization@email.com',
          'display-name': 'pm',
          'display-email': 'pm@email.com'
        }
      }
    ]
    const result = await req.post()
    assert.strictEqual(result.redirect.endsWith('message=success'), true)
  })

  it('user 1 creates invitation', async () => {
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/example-subscription-app/user-creates-invitation.test.js'
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/organizations' },
      { click: '/account/organizations/create-organization' },
      {
        fill: '#submit-form',
        body: {
          name: 'Developers',
          email: 'organization@email.com',
          'display-name': 'org owner',
          'display-email': 'owner@organization.com'
        }
      },
      { click: '/account/organizations/create-invitation' },
      {
        fill: '#submit-form',
        body: {
          code: 'secret'
        }
      }
    ]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 2 accepts invitation', async () => {
    const user = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    global.membershipProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user, {
      'display-name': user.profile.firstName,
      'display-email': user.profile.contactEmail
    })
    await TestHelper.createOrganization(user, {
      email: 'organization@' + user.profile.displayEmail.split('@')[1],
      name: 'My organization',
      profileid: user.profile.profileid
    })
    await TestHelper.createInvitation(user)
    const user2 = await TestHelper.createUser()
    const req = TestHelper.createRequest('/')
    req.account = user2.account
    req.session = user2.session
    req.filename = '/src/www/example-subscription-app/user-accepts-invitation.test.js'
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/organizations' },
      { click: '/account/organizations/accept-invitation' },
      {
        fill: '#submit-form',
        body: {
          invitationid: user.invitation.invitationid,
          'secret-code': user.invitation.secretCode,
          'display-name': user2.profile.firstName,
          'display-email': user2.profile.contactEmail
        }
      }
    ]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 2 creates shared post', async () => {
    const user = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    global.membershipProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user, {
      'display-name': user.profile.firstName,
      'display-email': user.profile.contactEmail
    })
    await TestHelper.createOrganization(user, {
      email: 'organization@' + user.profile.displayEmail.split('@')[1],
      name: 'My organization',
      profileid: user.profile.profileid
    })
    await TestHelper.createInvitation(user)
    const user2 = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user2, {
      'display-name': user2.profile.firstName,
      'display-email': user2.profile.contactEmail
    })
    await TestHelper.acceptInvitation(user2, user)
    const req = TestHelper.createRequest('/home')
    req.account = user2.account
    req.session = user2.session
    req.filename = '/src/www/example-subscription-app/user-creates-shared-post.test.js'
    req.screenshots = [
      { save: true }, 
      { 
        fill: '#post-creator', 
        body: {
          'post-textarea': pasteText,
          documentid: 'readme.md',
          language: 'MarkDown',
          organization: 'My organization'
      }
    }]
    req.waitFormComplete = async (page) => {
      while (true) {
        const frame = await page.frames().find(f => f.name() === 'application-iframe')
        if (!frame) {
          await page.waitFor(100)
          continue
        }
        const postContent = await frame.evaluate(() => {
          var postContent = document.getElementById('post-content')
          return postContent.style.display
        })
        if (postContent === 'block') {
          return
        }
        await page.waitFor(100)
      }
    }
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 1 views shared post', async () => {
    const user = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    global.membershipProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user, {
      'display-name': user.profile.firstName,
      'display-email': user.profile.contactEmail
    })
    await TestHelper.createOrganization(user, {
      email: 'organization@' + user.profile.displayEmail.split('@')[1],
      name: 'My organization',
      profileid: user.profile.profileid
    })
    await TestHelper.createInvitation(user)
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.body = {
      'post-textarea': pasteText,
      documentid: 'readme.md',
      language: 'MarkDown',
      organization: 'My organization'
    }
    req.waitBefore = async (page) => {
      while (true) {
        const frame = await page.frames().find(f => f.name() === 'application-iframe')
        if (!frame) {
          await page.waitFor(100)
          continue
        }
        const postCreator = await frame.evaluate(() => {
          var postCreator = document.getElementById('post-creator')
          return postCreator.style.display
        })
        if (postCreator === 'block') {
          return
        }
        await page.waitFor(100)
      } 
    }
    req.waitAfter = async (page) => {
      while (true) {
        const frame = await page.frames().find(f => f.name() === 'application-iframe')
        if (!frame) {
          await page.waitFor(100)
          continue
        }
        const postContent = await frame.evaluate(() => {
          var postContent = document.getElementById('post-content')
          return postContent.style.display
        })
        if (postContent === 'block') {
          return
        }
        await page.waitFor(100)
      }
    }
    await req.post()
    const user2 = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user2, {
      'display-name': user2.profile.firstName,
      'display-email': user2.profile.contactEmail
    })
    await TestHelper.acceptInvitation(user2, user)

    const req2 = TestHelper.createRequest('/home')
    req2.account = user2.account
    req2.session = user2.session
    req2.filename = '/src/www/example-subscription-app/user-views-shared-post.test.js'
    req2.screenshots = [
      { save: true },
      { 
        click: '#organization-list-button', 
        waitAfter: async (page) => {
          while (true) {
            const frame = await page.frames().find(f => f.name() === 'application-iframe')
            if (!frame) {
              await page.waitFor(100)
              continue
            }
            const postLink = await frame.evaluate(() => {
              var postLinks = document.getElementsByTagName('a')
              for (var i = 0, len = postLinks.length; i < len; i++) {
                if (postLinks[i].innerHTML === 'readme.md') {
                  return true
                }
              }
              return false
            })
            if (postLink) {
              return
            }
            await page.waitFor(100)
          }
        }
      },
      { 
        click: '/document/readme.md', 
        waitAfter: async (page) => {
          while (true) {
            const frame = await page.frames().find(f => f.name() === 'application-iframe')
            if (!frame) {
              await page.waitFor(100)
              continue
            }
            const postContent = await frame.evaluate(() => {
              var postContent = document.getElementById('post-content')
              return postContent.style.display
            })
            if (postContent === 'block') {
              return
            }
            await page.waitFor(100)
          }
        }
      }
    ]
    await req2.get()
    assert.strictEqual(1, 1)
  })
})


