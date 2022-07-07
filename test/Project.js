const { assert, expect } = require("chai")
const { ethers, waffle} = require("hardhat")
const provider = waffle.provider;

describe("Project", function () {

    let projectFactory
    let Project
    let creator
    const goal1 = 5*10**18 //5 ETH less than the 0.01 minimum contribution
    const goal2 = 0.001*10**18 //0.001 ETH less than the 0.01 minimum contribution
    let project
    let result
    const contribution1 = 1*10**18
    const contribution2 = 0.01*10**18
    const contrFail     = goal2
    const badgeName = "Project1"
    const badgeSymbol = "CRWD-1"
    
    const logger = ethers.utils.Logger.globalLogger()
    
    beforeEach(async function () {
        [deployer, creator, contributor1, contributor2] = await ethers.getSigners()
        const ProjectFactoryFactory = await ethers.getContractFactory("ProjectFactory")
        Project = await ethers.getContractFactory("Project");
        projectFactory = await ProjectFactoryFactory.deploy()
        await projectFactory.deployed()
        await projectFactory.connect(creator).createProject(goal1.toString(), badgeName, badgeSymbol);
        address = await projectFactory.projects(0)
        project = await Project.attach(address)
    })

    describe("deployment", async function() {;
      it("should revert if goal is less than 0.01 ETH", async function () {
        await expect(projectFactory.connect(creator).createProject(goal2.toString(), badgeName, badgeSymbol)).to.be.revertedWith('goal too low');
      });
      
      it("deloyed project must have correct creator", async function () {
        result = await project.creator()
        expect(result).to.equal(creator.address)
      });

      it("deloyed project must start not cancelled", async function () {
        result = await project.isCancelled()
        expect(result).to.equal(false)
      });

      it("deloyed project must have correct projectId", async function () {
        result = await project.projectId()
        expect(result).to.equal(1)
      });

      it("deloyed project must start with zero contributed", async function () {
        result = await project.contributed()
        expect(result.toString()).to.equal('0')
      });

      it("deloyed project must start with correct goal amount", async function () {
        result = await project.goal()
        expect(result.toString()).to.equal(goal1.toString())
      });

      it("deloyed project keeps track of start and end open for 30 days", async function () {
        let startDate = await project.startDate()
        let endDate   = await project.closeDate()
        let difference = endDate - startDate
        let days = difference/(60*60*24)
        expect(days).to.equal(30)
      });

    })

    describe("contribute()", async function() {

        describe("success", async function() {
            beforeEach(async function () {
                await project.connect(contributor1).contribute({value: contribution1.toString()})
                // addres can contribute as many times
                await project.connect(contributor1).contribute({value: contribution1.toString()})
                await project.connect(contributor1).contribute({value: contribution2.toString()})
                await project.connect(contributor2).contribute({value: contribution2.toString()})
                // project creator can also contribute
                await project.connect(creator).contribute({value: contribution1.toString()})
            })

            it("tracks contributors amounts", async function () {
                result = await project.contributors(contributor1.address)
                expect(result.toString()).to.equal((contribution1*2 + contribution2).toString())
                result = await project.contributors(contributor2.address)
                expect(result.toString()).to.equal(contribution2.toString())
                result = await project.contributors(creator.address)
                expect(result.toString()).to.equal(contribution1.toString())
            });

            it("tracks total contributions", async function () {
                result = await project.contributed()
                expect(result.toString()).to.equal((contribution1*2 + contribution2*2 + contribution1).toString())
            });

            it('emits event on contribution', async function () {
                await expect(project.connect(contributor1).contribute({value: contribution1.toString()}))
                .to.emit(project, 'Contribute')
                .withArgs(contributor1.address, contribution1.toString())
            })
        })

        describe("failure", async function() {

            it("should revert if contribution is less than 0.01 ETH", async function () {
                await expect(project.connect(creator).contribute({value: contrFail.toString()})).to.be.revertedWith('minimum contribition 0.01 ETH')
            });

            it("should revert if project goal reached", async function () {
                await project.connect(contributor2).contribute({value: goal1.toString()}) 
                await expect(project.connect(creator).contribute({value: contribution1.toString()})).to.be.revertedWith('project goal reached')
            });

            it("should revert if cancelled", async function () {
                await expect(project.connect(creator).cancel())
                await expect(project.connect(creator).contribute({value: contribution1.toString()})).to.be.revertedWith('project is cancelled')
            });

            it("should revert if closeDate has passed", async function () {
                const thirtyDays = 60*60*24*30
                await provider.send('evm_increaseTime', [thirtyDays]);
                await provider.send('evm_mine');
                await expect(project.connect(creator).contribute({value: contribution1.toString()})).to.be.revertedWith('project is closed')
            });         
        })

    }) 

    describe('nft badges', async function() {
        it('badge has a name and symbol', async function() {
            result = await project.name()
            expect(result).to.equal(badgeName)
            result = await project.symbol()
            expect(result).to.equal(badgeSymbol)
        })

        it("should give NFT badge to contributor if contribution >= 0.01 ETH", async function () {
            //initially no badges
            result = await project.badgeIds();
            expect(result).to.equal(0)
            // when contribution made Badge awarded 
            await project.connect(contributor1).contribute({value: contribution1.toString()})
            result = await project.badgeIds();
            expect(result).to.equal(1)
            // owner of tokenId 1 should be contributor1
            result = await project.ownerOf(1)
            expect(result).to.equal(contributor1.address)
            // contributor1 should have 1 token as balance
            result = await project.balanceOf(contributor1.address)
            expect(result).to.equal(1)
        });

        it("should not give NFT badge to contributor if contribution < 1 ETH", async function () {
            //initially no badges
            result = await project.badgeIds();
            expect(result).to.equal(0)
            // when contributions made Badge awarded only conributor1
            await project.connect(contributor2).contribute({value: contribution2.toString()})
            await project.connect(contributor1).contribute({value: contribution1.toString()})
            result = await project.badgeIds();
            expect(result).to.equal(1)
            // owner of tokenId 1 should be contributor1
            result = await project.ownerOf(1)
            expect(result).to.equal(contributor1.address)
            // contributor1 should have 1 token as balance
            result = await project.balanceOf(contributor1.address)
            expect(result).to.equal(1)
            // contributor2 should not have any badges
            result = await project.balanceOf(contributor2.address)
            expect(result).to.equal(0)

        });

        it('contributor keeps badge even if project is cancelled', async function() {
            await project.connect(contributor1).contribute({value: contribution1.toString()})
            await project.connect(creator).cancel() 
            // must still have badge 
            result = await project.badgeIds();
            expect(result).to.equal(1)
            // owner of tokenId 1 should be contributor1
            result = await project.ownerOf(1)
            expect(result).to.equal(contributor1.address)
            // contributor1 should have 1 token as balance
            result = await project.balanceOf(contributor1.address)
            expect(result).to.equal(1)

        })
    })

    describe("cancel", async function() {
        it("should revert if not called by creator", async function () {
          await expect(project.connect(contributor1).cancel()).to.be.revertedWith('not project creator');
        });
        
        it("should allow creator to cancel", async function () {
            await project.connect(creator).cancel()
            return assert.isTrue(true)
        });
  
        it("if cancelled updates isCancelled variable", async function () {
            await project.connect(creator).cancel() 
            result = await project.isCancelled()
            expect(result).to.equal(true)
        });
  
        it("should revert contribution to cancelled project", async function () {
            await project.connect(creator).cancel()
            await expect(project.connect(creator).contribute({value: contribution1.toString()})).to.be.revertedWith('project is cancelled')
        });

        it("cannot cancel an already cancelled project", async function () {
            await project.connect(creator).cancel()
            await expect(project.connect(creator).cancel()).to.be.revertedWith('project is cancelled')
        });

        it("cannot cancel project that reached its goal", async function () {
            await project.connect(contributor2).contribute({value: goal1.toString()}) 
            await expect(project.connect(creator).contribute({value: contribution1.toString()})).to.be.revertedWith('project goal reached')
        });

        it("cannot cancel project that passed closeDate", async function () {
            const thirtyDays = 60*60*24*30
            await provider.send('evm_increaseTime', [thirtyDays]);
            await provider.send('evm_mine');
            await expect(project.connect(creator).cancel()).to.be.revertedWith('project is closed')
        });
  
    })

    describe("contributorWithdraw()", async function() {

        beforeEach(async function () {
            await project.connect(contributor1).contribute({value: contribution1.toString()})
            // addres can contribute as many times
            await project.connect(contributor1).contribute({value: contribution1.toString()})
            await project.connect(contributor1).contribute({value: contribution2.toString()})
            await project.connect(contributor2).contribute({value: contribution2.toString()})
            // project creator can also contribute
            await project.connect(creator).contribute({value: contribution1.toString()})
        })

        describe("success", async function() {
           
            it("allows withdraws with right amounts if project is cancelled", async function () {

                let ethBefore = await provider.getBalance(contributor1.address)
                await project.connect(creator).cancel()
                await project.connect(contributor1).contributorWithdraw()
                result = await project.contributors(contributor1.address)
                expect(result.toString()).to.equal('0')
                let ethAfter = await provider.getBalance(contributor1.address)
                const totalContributed = contribution1*2 + contribution2
                
                let reconcile = (totalContributed - (Number(ethAfter))  + (Number(ethBefore)))/ 10**18 //should be close to 0 in ETH
                reconcile = Math.round(reconcile,4)
                expect(reconcile).to.equal(0)
            });

            it("allows withdraw is project failed to reach its goal", async function () {
                const thirtyDays = 60*60*24*30
                await provider.send('evm_increaseTime', [thirtyDays]);
                await provider.send('evm_mine');
                //check withdraw
                let ethBefore = await provider.getBalance(contributor1.address)
                await project.connect(contributor1).contributorWithdraw()
                result = await project.contributors(contributor1.address)
                expect(result.toString()).to.equal('0')
                let ethAfter = await provider.getBalance(contributor1.address)
                const totalContributed = contribution1*2 + contribution2
                
                let reconcile = (totalContributed - (Number(ethAfter))  + (Number(ethBefore)))/ 10**18 //should be close to 0 in ETH
                reconcile = Math.round(reconcile,4)
                expect(reconcile).to.equal(0)
                
            });

            it('emits event on contributors Withdrawals', async function () {
                const id = await project.projectId()
                await project.connect(creator).cancel()
                await expect(project.connect(creator).contributorWithdraw())
                .to.emit(project, 'UserWithdraw')
                .withArgs(id, creator.address, contribution1.toString())

            })
        })

        describe("failure", async function() {
      
            it("should revert if project not cancelled", async function () {
                await expect(project.connect(creator).contributorWithdraw()).to.be.revertedWith('project succeeded or still active')
            });

            it("should revert if project closeDate not reached ", async function () {
                const twentyNineDays = 60*60*24*29
                await provider.send('evm_increaseTime', [twentyNineDays]);
                await provider.send('evm_mine');
                await expect(project.connect(creator).contributorWithdraw()).to.be.revertedWith('project succeeded or still active')
            });

            it("should revert if contributor has withdrawn already", async function () {
                await project.connect(creator).cancel()
                await project.connect(contributor1).contributorWithdraw() 
                await expect(project.connect(contributor1).contributorWithdraw()).to.be.revertedWith('already withdrew')
            });
      
        })

    })
    
    describe("creatorWithdraw()", async function() {

        beforeEach(async function () {
            await project.connect(contributor1).contribute({value: contribution1.toString()}) 
        })

        describe("success", async function() {
           
            it("allows any withdraws from creator and emits event", async function () {
                await project.connect(contributor1).contribute({value: (contribution1*4).toString()}) //ensure target reached
                let reconcile 
                let ethBefore = await provider.getBalance(creator.address)
                let withdrawAmount = goal1/2
                let contribsBefore = await project.contributed()
                //console.log(contribsBefore)
                // advance time to projet closeTime
                const thirtyDays = 60*60*24*30
                await provider.send('evm_increaseTime', [thirtyDays]);
                await provider.send('evm_mine');
                // withdraw part amount 4 ETH
                await project.connect(creator).creatorWithdraw(withdrawAmount.toString())
                let contribsAfter  = await project.contributionsLeft()
                //console.log(contribsAfter)
                // reconcile contributions taken out and left 
                reconcile = contribsBefore - withdrawAmount - contribsAfter
                expect(reconcile).to.equal(0)
                // reconcile ETH balances 
                let ethAfter = await provider.getBalance(creator.address)
                reconcile = (withdrawAmount - (Number(ethAfter))  + (Number(ethBefore)))/ 10**18 //should be close to 0 in ETH
                reconcile = Math.round(reconcile,4)
                expect(reconcile).to.equal(0)
                /* proceed to withdraw remaining half after emit event and contributed(contirbutionLeft) balance to zero  */
                // event emitted when 
                result = await project.contributed()
                //console.log(result/10**18)
                const id = await project.projectId()
                await expect(project.connect(creator).creatorWithdraw(withdrawAmount.toString()))
                .to.emit(project, 'CreatorWithdraw')
                .withArgs(id, creator.address, withdrawAmount.toString())
                // contributionsLeft should be zero 
                contribsAfter  = await project.contributionsLeft()
                expect(contribsAfter.toString()).to.equal('0')

            });
     
        })

        describe("failure", async function() {
      
            it("should revert if project cancelled", async function () {
                await project.connect(creator).cancel()
                await expect(project.connect(creator).creatorWithdraw(contribution1.toString())).to.be.revertedWith('project cancelled or didnt succeed or still active')
            });

            it("should revert if project closeDate not reached ", async function () {
                const twentyNineDays = 60*60*24*29
                await provider.send('evm_increaseTime', [twentyNineDays]);
                await provider.send('evm_mine');
                await expect(project.connect(creator).creatorWithdraw(contribution1.toString())).to.be.revertedWith('project cancelled or didnt succeed or still active')
            });

            it("should revert if target not reached even after closeDate", async function () {
                const thirtyOneDays = 60*60*24*31
                await provider.send('evm_increaseTime', [thirtyOneDays]);
                await provider.send('evm_mine');
                await expect(project.connect(creator).creatorWithdraw(contribution1.toString())).to.be.revertedWith('project cancelled or didnt succeed or still active')
            });

            it("should revert if project goal reached", async function () {
                await project.connect(contributor1).contribute({value: contribution1.toString()}) //previously 4 times from beforeEach
                let contributed = await project.contributed()
                console.log(contributed)
                await expect(project.connect(creator).creatorWithdraw(contributed.toString())).to.be.revertedWith('project cancelled or didnt succeed or still active')
            });
      
        })

    })

})