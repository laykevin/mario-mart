import { useEffect, useState, useContext, useRef } from 'react';
import { AppContext } from '../lib';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { HiOutlineChevronRight } from 'react-icons/hi'
// import { AiOutlineCheckCircle } from 'react-icons/ai'
import { RelatedProducts, LoadingSpinner, QuantityCounter } from '../components'


export function ProductInformation() {
  const { productId } = useParams();
  const [product, setProduct] = useState();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const popover = useRef(null);

  useEffect(() => {
    (productId < 1 || productId > 36) && navigate('/catalog');
    async function loadProduct(productId) {
      try {
        popover.current?.dispose();
        popover.current = null;
        const productRes = await fetch(`/api/products/${productId}`);
        if (!productRes.ok) throw new Error(`This is not a shortcut`);
        const productResData = await productRes.json();
        setProduct(productResData);
        setIsLoading(false);
      } catch (err) {
        setError(err);
      } finally {
        console.log(1);
        setIsLoading(false);
        setQuantity(1);
        setAddedToCart(false);
        setError(null);
      }
    }
    setIsLoading(true);
    loadProduct(productId);
  }, [productId, navigate]);


  async function addToCart () {
    setButtonLoading(true);
    try {
      const token = localStorage.getItem('react-context-jwt')
      const cartId = user.cartId;
      const req = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId, productId, quantity }),
      };
      const res = await fetch('/api/mycart/addtocart', req);
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error)
      };
      setAddedToCart(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setButtonLoading(false);
    }
  }

  useEffect(() => {
    if (addedToCart || error) {
      // eslint-disable-next-line no-undef
      popover.current = bootstrap.Popover.getOrCreateInstance('#addedButton');
      popover.current?.show();
    }
  }, [addedToCart, error]);

  useEffect(() => {
    return () => {
      console.log("UNMOUNTING")
      popover.current?.dispose();
      popover.current = null;
    }
  }, []);

  if (isLoading) return (
    <LoadingSpinner />
  );

  // if (error) {
  //   return (
  //     <div className= "container text-white black-bg-img flex-grow-1">
  //       Error Loading Product {productId}: {error}
  //     </div>
  //   );
  // }

  if (!product) return null;

  const { productName, image, price, description, category } = product;

  return (
    <div className="container black-bg-img flex-grow-1">
      <div className="card shadow-sm" style={{ backgroundColor: 'rgb(255, 255, 255, 0.65)' }}>
        <div className="card-body">
          <div className="row">
            <div className="col">
              <Link className="btn text-secondary" to="/catalog">
                &lt; Back to catalog
              </Link>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-12 col-sm-6 col-md-5">
              <img src={image} alt={productName} className="image" />
            </div>
            <div className="col-12 col-sm-6 col-md-7">
              <h2>{productName}</h2>
              <h5 className="text-secondary">{`$${Number(price).toFixed(2)/100}`}</h5>
              <p>{description}</p>
              <div className={`${buttonLoading || error ? 'pe-none' : ''}`}>
                <QuantityCounter quantity={quantity} setQuantity={setQuantity} bgColor={'grey'} disable={addedToCart} />
              </div>
              {addedToCart || error
                ? <Link to="/mycart">
                    <button id="addedButton" className={`add-cart-button btn my-2 my-sm-0 ${error ? 'btn-danger' : 'btn-success'}`} data-bs-toggle="popover" data-bs-content={error ? `❌${error}` : `✔ Added ${quantity} to Kart!`} data-bs-trigger="manual" data-bs-placement="top">
                      Go to My Kart <HiOutlineChevronRight />
                    </button>
                  </Link>
                : <button onClick={addToCart} className="add-cart-button btn btn-success my-2 my-sm-0" disabled={buttonLoading}>
                    {buttonLoading
                      ? <span className="spinner-border spinner-border-sm text-secondary" role="status"></span>
                      : 'Add to cart'
                    }
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm bg-opacity-0" style={{ backgroundColor: 'rgb(0, 0, 0, 0)' }}>
        <div className={`card-body text-white ${buttonLoading ? 'pe-none' : ''}`}>
          <RelatedProducts category={category} productId={productId}/>
        </div>
      </div>
    </div>
  );
}
