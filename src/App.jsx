import TableApi from './services/api'
import React, { useState } from 'react';
import './App.css'

function App() {
  const [token, setToken] = useState('af1874616430e04cfd4bce30035789907e899fc7c3a1a4bb27254828ff304a77');
  const [api, setApi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pboxes, setPboxes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [priceType, setPriceType] = useState([]);
  const [nomenclature, setNomenclature] = useState([]);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedPaybox, setSelectedPaybox] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedPriceType, setSelectedPriceType] = useState(null);

  const [cart, setCart] = useState([]);
  const [comment, setComment] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [searchPhoneInput, setSearchPhoneInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [selectedPayboxId, setSelectedPayboxId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedPriceTypeId, setSelectedPriceTypeId] = useState('');

  const handleConnect = async () => {
    if (!token) {
      alert('Введите токен');
      return;
    }

    setLoading(true);

    try {
      const apiInstance = new TableApi(token);
      setApi(apiInstance);

      const clientsData = await apiInstance.getClients();
      const warehousesData = await apiInstance.getWarehouses();
      const pboxesData = await apiInstance.getPboxes();
      const organizationsData = await apiInstance.getOrganizations();
      const priceTypeData = await apiInstance.getPriceType();
      const nomenclatureData = await apiInstance.getNomenclature();

      const clientsArray = clientsData.result;
      const warehousesArray = warehousesData.result;
      const pboxesArray = pboxesData.result;
      const organizationsArray = organizationsData.result;
      const priceTypeArray = priceTypeData.result;
      const nomenclatureArray = nomenclatureData.result;

      setClients(clientsArray);
      setWarehouses(warehousesArray);
      setPboxes(pboxesArray);
      setOrganizations(organizationsArray);
      setPriceType(priceTypeArray);
      setNomenclature(nomenclatureArray);

      setIsConnected(true);
      console.log('Подключено успешно!');
    } catch (error) {
      console.error('Ошибка: ', error);
    } finally {
      setLoading(false);
    }
  }

  const updatePrice = (id, newPrice) => {
    if (newPrice < 0) return;
    setCart(cart.map(item =>
      item.id === id
        ? {
          ...item,
          price: newPrice,
          sum: newPrice * item.quantity
        }
        : item
    ));
  };

  const handleSearchClientChange = (e) => {
    setSearchPhoneInput(e.target.value);
  };

  const performClientSearch = () => {

    const clientsArray = Array.isArray(clients) ? clients : [];
    const filtered = clientsArray.filter((client) => {
      if (!client.phone) return false;
      return client.phone.includes(searchPhoneInput);
    });

    setSearchResults(filtered);
    setSearchQuery(searchPhoneInput);

  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      performClientSearch();
    }
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setSearchPhoneInput(client.phone);
    setSearchQuery(client.phone);
    setSearchResults([]);
  };

  const handleSearchProduct = (e) => {
    const inputValue = e.target.value;
    setProductSearch(inputValue);

    if (inputValue.length < 2) {
      setProductResults([]);
      setShowDropdown(false);
      return;
    }

    const nomenclatureArray = Array.isArray(nomenclature) ? nomenclature : [];

    const filtered = nomenclatureArray.filter((product) => {
      return product.name?.toLowerCase().includes(inputValue.toLowerCase());
    });

    setProductResults(filtered.slice(0, 10));
    setShowDropdown(true);
  };

  const addToCart = (product) => {
    const productPrice = product.price || product.sale_price || 1;
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, sum: (item.quantity + 1) * productPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        quantity: 1,
        sum: product.price || 0
      }]);
    }
    setProductSearch('');
    setProductResults([]);
    setShowDropdown(false);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, sum: (item.price || 0) * newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalSum = () => {
    return cart.reduce((sum, item) => sum + (item.sum || 0), 0);
  };

  const createOrder = async (conduct = false) => {
    if (!api) {
      alert('Сначала подключите кассу');
      return;
    }

    if (cart.length === 0) {
      alert('Добавьте хотя бы один товар');
      return;
    }

    if (!selectedOrganization || !selectedWarehouse) {
      alert('Выберите организацию и склад');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        operation: "Заказ",
        dated: Math.floor(Date.now() / 1000),
        organization: Number(selectedOrganization.id),
        warehouse: Number(selectedWarehouse.id),
        goods: cart.map(item => ({
          nomenclature: Number(item.id),
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        status: conduct
      };

      if (selectedClient?.id) orderData.contragent = Number(selectedClient.id);
      if (selectedPaybox?.id) orderData.paybox = Number(selectedPaybox.id);
      if (selectedPriceType?.id) orderData.price_type = Number(selectedPriceType.id);
      if (comment) orderData.comment = comment;

      const requestBody = [orderData];

      let orderSum = getTotalSum().toFixed(2);

      const result = await api.createSale(requestBody);

      alert(
        `${conduct ? 'Продажа создана и проведена!' : 'Продажа создана!'}\n\n` +
        `ID заказа: ${String(orderData.dated).slice(-6)}\n` +
        `Сумма: ${Number(orderSum).toFixed(2)} ₽`
      );

      setCart([]);
      setComment('');
      setSelectedClient(null);
      setSearchPhone('');

    } catch (error) {
      console.error('Ошибка:', error);
      if (error.response?.data) {
        console.log('Детали ошибки:', error.response.data);
        alert('Ошибка: ' + JSON.stringify(error.response.data.detail, null, 2));
      } else {
        alert('Ошибка: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className='container'>
        <section className='title s-p-16 m-16 b-16px'>
          <h2 className='gray'>TABLECRM.COM</h2>
          <h1 className='mob'>Мобильный заказ</h1>
          <p className='web gray'>WebApp для создания продажи и проведения в один клик.</p>
          <div className='sales-info'>
            <p className={`cas ${isConnected ? 'green' : 'red'}`}>
              {isConnected ? 'Касса подключена' : 'Касса не подключена'}
            </p>
            <p className='cas gray p-sales'>{isConnected ? `Организаций: ${organizations.length}` : ''}</p>
            <p className='cas gray p-sales'>{isConnected ? `Товаров: ${nomenclature.length}` : ''}</p>
          </div>
        </section>

        <div className='cards'>
          <div className='card p-16 m-16'>
            <div className='card__header'>
              <div className='card__title'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                  <path d="m2 22 3-3" />
                  <path d="M7.5 13.5 10 11" />
                  <path d="M10.5 16.5 13 14" />
                  <path d="m18 3-4 4h6l-4 4" />
                </svg>
                <p className='m-text'>1. Подключение кассы</p>
              </div>
              <p className='gray'>Введите токен и загрузите справочники</p>
            </div>

            <div className='card__content'>
              <label>Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Введите token кассы"
                disabled={isConnected}
              />
              <button
                onClick={handleConnect}
                className='orange btn-submit'
                disabled={isConnected || loading}
              >
                {loading ? 'Подключение' : 'Подключить'}
              </button>
            </div>
          </div>

          <div className='card p-16 m-16'>
            <div className='card__header'>
              <div className='card__title'>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                </svg>
                <p className='m-text'>2. Клиент</p>
              </div>
              <div className='card__desc'>
                <p className='gray'>Поиск клиента по телефону</p>
              </div>
            </div>

            <div className='card__content'>
              <div className='card__content-phone'>
                <label>Телефон</label>
                <div className='phone-input'>
                  <input
                    type="text"
                    className='input'
                    value={searchPhoneInput}
                    onChange={handleSearchClientChange}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="+79990000000"
                    disabled={!isConnected}
                  />
                  <button
                    className='phone-submit'
                    onClick={performClientSearch}
                    disabled={!isConnected}
                  >
                    <svg className='gray' width="16" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21 21-4.34-4.34" />
                      <circle cx="11" cy="11" r="8" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='card__content-client'>
                <label>Найденный клиент</label>
                {selectedClient ? (
                  <div className="selected-client">
                    <div>
                      <div className="client-name">{selectedClient.name || 'Без имени'}</div>
                      <div className="client-phone">{selectedClient.phone || 'Нет телефона'}</div>
                    </div>
                    <button onClick={() => {
                      setSelectedClient(null);
                      setSearchPhoneInput('');
                      setSearchResults([]);
                    }}>✕</button>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="search-results">
                    {searchResults.map(client => (
                      <div key={client.id} className="search-result-item" onClick={() => selectClient(client)}>
                        <div className="client-name">{client.name || 'Без имени'}</div>
                        <div className="client-phone">{client.phone || 'Нет телефона'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="gray" style={{ padding: '10px', textAlign: 'center' }}>
                    Клиент не выбран
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='card p-16 m-16'>
            <div className='card__header'>
              <p className='m-text'>3. Параметры продажи</p>
              <p className='gray'>Счёт, организация, склад и тип цены</p>
            </div>

            <div className='card__content'>
              <label>Организация</label>
              <select
                className='card-list'
                value={selectedOrganization?.id || ''}
                onChange={(e) => {
                  setSelectedOrganizationId(e.target.value);
                  const org = organizations.find(o => o.id === parseInt(e.target.value));
                  setSelectedOrganization(org);
                }}
                disabled={!isConnected}
              >
                <option value="">Выберите организацию</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {selectedOrganization?.id === org.id ? org.id : org.short_name}
                  </option>
                ))}
              </select>

              <label>Счёт</label>
              <select
                className='card-list'
                value={selectedPaybox?.id || ''}
                onChange={(e) => {
                  setSelectedPayboxId(e.target.value);
                  const box = pboxes.find(p => p.id === parseInt(e.target.value));
                  setSelectedPaybox(box);
                }}
                disabled={!isConnected}
              >
                <option value="">Выберите счёт</option>
                {pboxes.map(box => (
                  <option key={box.id} value={box.id}>{selectedPayboxId === String(box.id) ? box.id : box.name}</option>
                ))}
              </select>

              <label>Склад</label>
              <select
                className='card-list'
                value={selectedWarehouse?.id || ''}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  const wh = warehouses.find(w => w.id === parseInt(e.target.value));
                  setSelectedWarehouse(wh);
                }}
                disabled={!isConnected}
              >
                <option value="">Выберите склад</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}> {selectedWarehouseId === String(wh.id) ? wh.id : wh.name}</option>
                ))}
              </select>

              <label>Тип цены</label>
              <select
                className='card-list'
                value={selectedPriceType?.id || ''}
                onChange={(e) => {
                  setSelectedPriceTypeId(e.target.value);
                  const pt = priceType.find(p => p.id === parseInt(e.target.value));
                  setSelectedPriceType(pt);
                }}
                disabled={!isConnected}
              >
                <option value="">Выберите тип цены</option>
                {priceType.map(pt => (
                  <option key={pt.id} value={pt.id}>{selectedPriceTypeId === String(pt.id) ? pt.id : pt.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className='card p-16 m-16'>
            <div className='card__header'>
              <div className='card__title'>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22V12" />
                  <path d="M16 17h6" />
                  <path d="M19 14v6" />
                  <path d="M21 10.535V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955" />
                  <path d="M3.29 7 12 12l8.71-5" />
                </svg>
                <p className='m-text'>4. Товары</p>
              </div>
              <p className='gray'>Поиск и добавление номенклатуры</p>
            </div>

            <div className='card__content'>
              <div className="product-search">
                <input
                  type="text"
                  className='card-search'
                  value={productSearch}
                  onChange={handleSearchProduct}
                  placeholder="Поиск товаров..."
                  disabled={!isConnected}
                />
                {showDropdown && productResults.length > 0 && (
                  <div className="product-dropdown">
                    {productResults.map(product => (
                      <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">{product.price || 0} ₽</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='product-content'>
                <div className='product-cards'>
                  {nomenclature.length === 0 ? (
                    <div className="gray">Товары не найдены</div>
                  ) : (
                    nomenclature.map(product => (
                      <div
                        key={product.id}
                        className="product-card__item"
                        onClick={() => addToCart(product)}
                      >
                        <div className='item-desc'>
                          <p className='product-name'>{product.name}</p>
                          <p className='product-price'>
                            {product.price ? `${product.price.toLocaleString()} ₽` : 'цена не указана'}
                          </p>
                        </div>
                        <button
                          className='item-buy'
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <p className='font-medium'>Добавить</p>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='card p-16 m-16'>
            <div className='card__header'>
              <div className='card__title'>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <p className='m-text'>Корзина</p>
              </div>
              <p className='gray'>Количество, цена и сумма по позициям</p>
            </div>

            <div className='card__content'>
              {cart.length === 0 ? (
                <div className='gray empty-cart'><p>Добавьте хотя бы один товар</p></div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className='cart-item-compact'>
                    <div className="cart-item-header">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-unit">Ед. изм.: шт</span>
                    </div>
                    <div className="cart-item-fields">
                      <div className="field">
                        <span className="field-label">Количество</span>
                        <div className="field-control">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <div className="field">
                        <span className="field-label">Цена</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          className="price-input"
                        />
                      </div>
                    </div>
                    <div className="cart-item-sum">
                      Сумма: {item.sum.toFixed(2)} ₽
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className='card p-16 m-16'>
            <div className='card__header'>
              <p className='m-text'>Комментарий</p>
            </div>
            <div className='card__content'>
              <textarea
                name="comment"
                className='comment'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий к заказу (не обязательно)"
                disabled={!isConnected}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='check'>
        <div className='check-summary'>
          <p>Итого</p>
          <p>{getTotalSum().toFixed(2)} ₽</p>
        </div>
        <div className='gap-5'>
          <button
            className='check-create orange-n'
            onClick={() => createOrder(false)}
            disabled={!isConnected || cart.length === 0 || loading}
          >
            <p className='white'>Создать продажу</p>
          </button>
          <button
            className='check-create'
            onClick={() => createOrder(true)}
            disabled={!isConnected || cart.length === 0 || loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p className='gray'>Создать и провести</p>
          </button>
        </div>
      </div>
    </>
  )
}

export default App;