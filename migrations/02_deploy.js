const NFT = artifacts.require('NFT');
const Royalties = artifacts.require('Royalties');

const deployCollections = async (deployer, network, accounts) => {
  const userAddress = '0xE7F506aAf42540B91bc6e5d2e109378d66de63EE';
  const wethAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
  const name = 'ROYALTIES TEST';
  const fees = 4;
  const totalSupply = 10000;

  // await deployer.deploy(NFT, name, name);

  const nft = await NFT.at('0xd5197aee9ea0dc7a5b40a3cbb6397e08ccbc499f');

  // await nft.addMinter(userAddress);

  await deployer.deploy(
    Royalties,
    wethAddress,
    userAddress,
    nft.address,
    totalSupply
  );

  const royalties = await Royalties.deployed();

  // await nft.setRoyaltiesFees(fees);
  await nft.setRoyaltiesAddress(royalties.address);
};

module.exports = deployCollections;
