const { assert, expect } = require("chai")
const { ethers, waffle} = require("hardhat")
const provider = waffle.provider

describe("Project Factory Contract", function () {

    let projectFactory
    let Project
    let creator1
    let creator2
    let creator3
    const goal1 = 100*10**18 //100 ETH
    const goal2 = 5*10**18 //5 ETH
    const goal3 = 0.1*10**18 //0.1 ETH
    const badgeName = "Project1"
    const badgeSymbol = "CRWD-1"
    
    const logger = ethers.utils.Logger.globalLogger()
    
    beforeEach(async function () {
        [deployer, creator1, creator2, creator3] = await ethers.getSigners()
        const ProjectFactoryFactory = await ethers.getContractFactory("ProjectFactory")
        Project = await ethers.getContractFactory("Project")
        projectFactory = await ProjectFactoryFactory.deploy()
        await projectFactory.deployed()
    })

    describe("deployment", async function() {
      it("should assert true is deployed", async function () {
        await projectFactory.deployed()
        return assert.isTrue(true)
      });
      it('emits event on project creation', async function () {
        await expect(projectFactory.connect(deployer).createProject(goal1.toString(), badgeName, badgeSymbol))
        .to.emit(projectFactory, 'ProjectCreated')
        .withArgs(deployer.address, 1, goal1.toString())
      })
    })

    describe("createProject and getProjects", async function() {
      it("should create a new projects with corect details", async () => {
        // create 5 proejcts 
        await projectFactory.connect(creator1).createProject(goal1.toString(), badgeName, badgeSymbol)
        await projectFactory.connect(creator2).createProject(goal2.toString(), badgeName, badgeSymbol)
        await projectFactory.connect(creator3).createProject(goal3.toString(), badgeName, badgeSymbol)
        await projectFactory.connect(creator1).createProject(goal3.toString(), badgeName, badgeSymbol)
        await projectFactory.connect(creator3).createProject(goal2.toString(), badgeName, badgeSymbol)
        // there should be 5 projects created and tracked by Factory
        const projects = await projectFactory.getProjects()
        console.log(projects.length.to)
        expect(projects.length).to.equal(5)
        // check project1 have correct data 
        const address1 = projects[0];
        const project1 = await Project.attach(address1)
        const creator_1 = await project1.creator()
        const goal_1    = await project1.goal()
        expect(creator_1).to.equal(creator1.address)
        expect(goal_1.toString()).to.equal(goal1.toString())
        // check project2 have correct data 
        const address2 = projects[1]
        const project2 = await Project.attach(address2)
        const creator_2 = await project2.creator()
        const goal_2    = await project2.goal()
        expect(creator_2).to.equal(creator2.address)
        expect(goal_2.toString()).to.equal(goal2.toString())
        // check project3 have correct data 
        const address3 = projects[2]
        const project3 = await Project.attach(address3)
        const creator_3 = await project3.creator()
        const goal_3    = await project3.goal()
        expect(creator_3).to.equal(creator3.address)
        expect(goal_3.toString()).to.equal(goal3.toString())
        // check project4 have correct data 
        const address4 = projects[3]
        const project4 = await Project.attach(address4)
        const creator_4 = await project4.creator()
        const goal_4    = await project4.goal()
        expect(creator_4).to.equal(creator1.address)
        expect(goal_4.toString()).to.equal(goal3.toString())
        // check project5 have correct data 
        const address5 = projects[4]
        const project5 = await Project.attach(address5)
        const creator_5 = await project5.creator()
        const goal_5    = await project5.goal()
        expect(creator_5).to.equal(creator3.address)
        expect(goal_5.toString()).to.equal(goal2.toString())
      });
    }) 

})