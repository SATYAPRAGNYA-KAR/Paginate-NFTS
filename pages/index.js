import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Metaplex } from '@metaplex-foundation/js';//js sdk of Metaplex; Metaplex class and interface of metaflex are imported
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';//mainnet, testnet and devnet are three clusters of Solana; We'll use the mainnet
//Public key used as reference

const connection = new Connection(clusterApiUrl('mainnet-beta'));//Connection object creates a new connection to that URL
const mx = Metaplex.make(connection);

const Home = () => {
  const [address, setAddress] = useState(
    'Geh5Ss5knQGym81toYGXDbH3MFU2JCMK7E4QyeBHor1b',
  );//Wallet address from where NFTs fetched

  const [nftList, setNftList] = useState(null);
  const [loading, setLoading] = useState(false);//When something is loading, then some loading icon to be shown
  const [currentPage, setCurrentPage] = useState(1);//The page on which we are will hold here
  const [currentView, setCurrentView] = useState(null);//The NFT list on any page given by currentView
  const perPage = 1;//A static variable, if changed to 2, then no. of NFTs displayed per page=2 and so on

  //Onchain Metadata and Offchain Metadata are types of NFT
  const fetchNFTs = async () => {
    // add some code here
    try {
      setLoading(true);
      setCurrentView(null);
      const list = await mx.nfts().findAllByOwner(new PublicKey(address));
      setNftList(list);
      setCurrentPage(1);
   } catch (e) {
      console.error(e);
   }
    // const myNfts = await     metaplex.nfts().findAllByOwner(metaplex.identity().address);
  };
  //Pagiantion not supported by Solana, so we'll simulate the Pagination to not provide load to Solana server
  //Greater number of NFT's offchain metadata if fetched even would create much load
  //Unmutable things like creator, value, etc. are stored in Onchain and image, name, etc. are stored in Offchain as these data may be of great sizes and fetching them is difficult
  //Data once fetched is cached to reduce refetching

  useEffect(() => {
   if (!nftList) {
      return;
   }

   const execute = async () => {
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = currentPage * perPage;
      await loadData(startIndex, endIndex);
      setCurrentView(nftList.slice(startIndex, endIndex));
      setLoading(false);
   };
   execute();
}, [nftList, currentPage]);

  const loadData = async (startIndex, endIndex) => {
 const nftsToLoad = nftList.filter((nft, index) => {
   return (
     index >= startIndex && index < endIndex && nft.metadataTask.isPending()
   );
 });

 const promises = nftsToLoad.map((nft) => nft.metadataTask.run());//Promises got here
 await Promise.all(promises);//Takes an array of promises and as all promises fulfilled, this function called
};

  const changeCurrentPage = (operation) => {
    // add some code here
    if(operation=='prev'){
      setCurrentPage(currentPage-1);
    }
    else if(operation=='next'){
      setCurrentPage(currentPage+1);
    }
  };

  return (
    <div>
      <Head>
        <title>Metaplex and Next.js Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.App}>
        <div className={styles.container}>
          <h1 className={styles.title}>Wallet Address</h1>
          <div className={styles.nftForm}>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <button className={styles.styledButton} onClick={fetchNFTs}>
              Fetch
            </button>
          </div>
          {loading ? (
            <img className={styles.loadingIcon} src="/loading.svg" />
          ) : (
            currentView &&
            currentView.map((nft, index) => (
              <div key={index} className={styles.nftPreview}>
                <h1>{nft.name}</h1>
                <img
                  className={styles.nftImage}
                  src={nft.metadata.image || '/fallbackImage.jpg'}
                  alt="The downloaded illustration of the provided NFT address."
                />
              </div>
            ))
          )}
          {currentView && (
            <div className={styles.buttonWrapper}>
              <button
                disabled={currentPage === 1}
                className={styles.styledButton}
                onClick={() => changeCurrentPage('prev')}
              >
                Prev Page
              </button>
              <button
                disabled={nftList && Math.ceil(nftList.length / perPage) === currentPage}
                className={styles.styledButton}
                onClick={() => changeCurrentPage('next')}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
