const BigNumber = require('bignumber.js');
const { assert } = require('chai');
const chai = require('chai');
const truffleAssert = require('truffle-assertions');

const Royalties = artifacts.require('./Royalties.sol');
const WETH = artifacts.require('./WETH.sol');
const NFT = artifacts.require('./NFT.sol');

const { advanceTimeAndBlock, itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('Royalties', (accounts) => {
  const owner = accounts[0];
  const user = accounts[1];
  const user2 = accounts[2];
  const creator = accounts[3];
  let weth;
  let royalties;
  let nft;
  before(async () => {
    weth = await WETH.new();
    nft = await NFT.new('test', 'test', {
      from: creator
    });
    await nft.mint(user, '', {
      from: creator
    });
    await nft.mint(user2, '', {
      from: creator
    });
    royalties = await Royalties.new(
      weth.address,
      creator,
      nft.address,
      1000
    );
    await nft.setRoyaltiesAddress(royalties.address, {
      from: creator
    });
  });
  describe('Royalties', () => {
    it('transfer royalties', async () => {
      const takerFee = web3.utils.toWei('10');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);
      const creatorBalance = await royalties.getCreatorBalance();
      assert.equal(creatorBalance.toString(), (takerFee / 4).toString());
    });

    it('creator claims', async () => {
      const creatorBalance = await royalties.getCreatorBalance();
      const totalCollected = await royalties.getTotalCollected();
      await royalties.claimCreator({ from: creator });
      const balance = await weth.balanceOf(creator);
      assert.equal(creatorBalance.toString(), balance.toString());
    });

    itShouldThrow('scam creator claims', async () => {
      const scamClaiming = await royalties.claimCreator({ from: user2 });
    }, 'Only creator can claim');

    it('user claim', async () => {
      const totalTokenRoyalties = await royalties.getTokenTotalRoyalties();
      const tokenBalance = await royalties.getTokenBalance('1');
      assert.equal(tokenBalance.toString(), totalTokenRoyalties.toString());
      await royalties.claimCommunity('1', { from: user });
      const balance = await weth.balanceOf(user);
      assert.equal(balance.toString(), tokenBalance.toString());
    });

    it('transfer more royalties', async () => {
      const tokenBalance = await royalties.getTokenBalance('1');
      assert.equal(tokenBalance.toString(), '0');
      const takerFee = web3.utils.toWei('10');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);
      const tokenBalance1 = await royalties.getTokenBalance('1');
      const shouldHaveBalance = (takerFee * 0.75) / 1000; // already claimed once
      assert.equal(tokenBalance1.toString(), shouldHaveBalance);
      const tokenBalance2 = await royalties.getTokenBalance('2');
      assert.equal(tokenBalance2.toString(), shouldHaveBalance * 2);
    });

    it('transfer nft is auto claiming', async () => {
      const takerFee = web3.utils.toWei('10');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);
      const balanceBefore = await weth.balanceOf(user);
      const tokenBalance1Before = await royalties.getTokenBalance('1');
      await nft.safeTransferFrom(user, user2, 1, {
        from: user
      });
      const tokenBalance1 = await royalties.getTokenBalance('1');
      assert.equal(tokenBalance1.toString(), 0);

      const balanceAfter = await weth.balanceOf(user);

      // checking that the user actually for the auto claim tokens
      assert.equal(balanceAfter - balanceBefore, tokenBalance1Before);
    });

    it('Small numbers', async () => {
      // making sure the token balance for token id 1 is zero
      const tokenBalance1 = await royalties.getTokenBalance('1');
      assert.equal(tokenBalance1.toString(), 0);
      // transfer weird amount
      const takerFee = web3.utils.toWei('0.15');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);
      // calc the expected value
      const expectedValue = takerFee * 0.75 / 1000;

      const tokenBalance1After = await royalties.getTokenBalance('1');
      assert.equal(tokenBalance1After.toString(), Math.floor(expectedValue));
    });

    it('claiming after collection size decrease should make the balance bigger - real balance POC', async () => {
      // getting the token balance
      const tokenBalanceBeforeDecrease = await royalties.getTokenBalance('5');
      // decreasing collection size
      await royalties.setCollectionSize('500');
      // clamining royalty for creator
      await royalties.claimCreator({ from: creator });
      // getting the new token balance
      const tokenBalanceAfterDecrease = await royalties.getTokenBalance('5');
      assert.isAbove(Number(tokenBalanceAfterDecrease), Number(tokenBalanceBeforeDecrease));
    });

    it('claiming after collection size decrease should make the balance bigger - determinant balance', async () => {
      // getting the token balance
      const tokenBalanceBeforeDecrease = await royalties.getTokenTotalRoyalties();
      // calculating the total community royalties
      const totalCommunityRoyalties = tokenBalanceBeforeDecrease * 500;
      // decreasing the collection size
      await royalties.setCollectionSize('328');
      // calculating the expceted royalty per token
      const expectedCommunityRoyaltiesPerToken = totalCommunityRoyalties / 328;
      // getting token total royalties
      const tokenBalanceAfterDecrease = await royalties.getTokenTotalRoyalties();
      assert.equal(tokenBalanceAfterDecrease.toString(), expectedCommunityRoyaltiesPerToken);
    });

    itShouldThrow('collection size cant change to bigger than its current size', async () => {
      // trying to change the collection size to be bigger then its current size
      await royalties.setCollectionSize('2000');
    }, 'Cannot increase collection size');

    it('creator address changed, added funds and then creator claims', async () => {
      // changing creator address
      await royalties.setCreatorAddress(user2);
      const takerFee = web3.utils.toWei('10');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);
      // getting creator balance before claiming
      const creatorBalance = await royalties.getCreatorBalance();
      // creator claiming royalties
      await royalties.claimCreator({ from: user2 });
      // getting user2 balance (the new creator)
      const balance = await weth.balanceOf(user2);
      assert.equal(creatorBalance.toString(), balance.toString());
    });

    it('claiming community batch from an array of tokenIDs', async () => {
      await royalties.setCollectionSize('10');
      // create 8 more nfts
      await Promise.all((new Array(8)).fill(1).map(() => nft.mint(user, '', {
        from: creator
      })));
      // claim all 10 nfts community
      const tokensArray = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10];
      await royalties.claimCommunityBatch(tokensArray, {
        from: user
      });
      // claim creator happend on previous test - no balance left
      const balance = await weth.balanceOf(royalties.address);
      assert.equal(balance.toString(), '0');
    });

    it('getting the sum of all tokens balances from getTokensBalance', async () => {
      // array of tokens
      const tokensArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      // getting the sum from the contract function
      const getTokensBalance = await royalties.getTokensBalance(tokensArray, {
        from: user
      });
      // mimic of the function logic from contract
      let tokensBalance = BigNumber(0);
      const balances = await Promise.all(
        tokensArray.map((tokenID) => royalties.getTokenBalance(tokenID))
      );

      balances.forEach((x) => {
        tokensBalance = tokensBalance.plus(x);
      });
      // asserting to see if equal
      assert.equal(getTokensBalance.toString(), tokensBalance.toString());
    });

    /* // STRESS TEST - UNCOMMENT AND COMMENT ALL OTHER TESTS
    it('claiming community batch from an array of tokenIDs stress test', async () => {
      // await royalties.setCollectionSize(accounts.length);
      const takerFee = web3.utils.toWei('100');
      // send royalties to contract
      await weth.transfer(royalties.address, takerFee);

      const tokens = [];
      for (let i = 1; i < accounts.length; i++) {
        tokens.push(i);
      }

      const currentUser = accounts[Math.round(accounts.length / 2)];
      await Promise.all((tokens.map(() => nft.mint(currentUser, '', {
        from: creator
      }))));

      const tokensBalance = await royalties.getTokensBalance(tokens, {
        from: currentUser
      });

      await royalties.claimCommunityBatch(tokens, {
        from: currentUser
      });
      // claim creator happend on previous test - no balance left
      const balance = await weth.balanceOf(currentUser);
      assert.equal(balance.toString(), tokensBalance.toString());
    }); */
  });
});
