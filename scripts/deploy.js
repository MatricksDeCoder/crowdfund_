async function main() {
    const [deployer, artist] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
    const projectFactory = await ProjectFactory.deploy();
  
    console.log("ProjectFactory:", projectFactory.address);

    // create an example project 
    const goal = 100*10**18 // 100 ETH
    const project = await projectFactory.createProject(goal);
    console.log("Project:", project.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

// deploy to ropstein e.g npx hardhat run scripts/deploy.js --network ropsten 
// deploy to local node e.g npx hardhat run scripts/deploy.js 