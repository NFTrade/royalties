const NFT = artifacts.require('NFT');
const Royalties = artifacts.require('Royalties');

const deployCollections = async (deployer, network, accounts) => {
  /* const userAddress = '0x0x000000000000000000000000000000000000000';
  const wethAddress = '0x000000000000000000000000000000000000000';
  const name = 'ROYALTIES TEST';
  const fees = 4;
  const totalSupply = 10000;

  await deployer.deploy(NFT, name, name);

  const nft = await NFT.deployed();

  await nft.addMinter(userAddress);

  await deployer.deploy(
    Royalties,
    wethAddress,
    userAddress,
    nft.address,
    totalSupply
  );

  const royalties = await Royalties.deployed();

  await nft.setRoyaltiesFees(fees);
  await nft.setRoyaltiesAddress(royalties.address); */
};

module.exports = deployCollections;
