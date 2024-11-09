
# Parakolay Node.JS SDK

Bu SDK, Node.JS ortamında Express Framework ile Parakolay API kullanımını kolaylaştırmak için geliştirilmiş bir yazılımdır. SDK, [Parakolay](https://www.parakolay.com) ödeme sistemi ile etkileşim kurmak için gerekli tüm işlevselliği sağlar. Bu dokümantasyon, SDK'nın nasıl kurulacağını, yapılandırılacağını ve kullanılacağını adım adım gösterir.

## Kurulum

SDK'yı kullanabilmek için öncelikle Node.JS projenize src klasöründeki dosyaları eklemeniz gerekmektedir. 

## API Anahtarları

SDK'yı kullanabilmek için Parakolay tarafından sağlanan API anahtarlarına ihtiyacınız vardır. Bu anahtarlar şunlardır:

- `apiKey`
- `apiSecret`
- `merchantNumber`

Bu bilgileri [Parakolay](https://merchant.parakolay.com) hesabınızdan edinebilirsiniz.

## Başlangıç

SDK'yı projenize ekledikten sonra, .env içerisinde aşağıdaki girişleri yapmanız gerekmektedir.

```
API_BASE_URL=your_base_url
API_KEY=your_api_key
API_SECRET=your_api_secret
MERCHANT_NUMBER=your_merchant_number
```

Sonrasında index.js dosyası içerisindeki örneklerde olduğu gibi aşağıdaki şekilde init edebilirsiniz:

```javascript
    const parakolay = new Parakolay(
        process.env.API_BASE_URL,
        process.env.API_KEY,
        process.env.API_SECRET,
        process.env.MERCHANT_NUMBER,
        req.body.conversationID,
        req.ip
    );
```

## Ödeme İşlemleri

### 3D Secure Başlatma

3D Secure ödeme işlemi başlatmak için `Init3DS` metodunu kullanabilirsiniz. Örnek kullanım aşağıdaki gibidir:

```javascript
    const result = await parakolay.init3DS(
        cardNumber,
        cardholderName,
        expireMonth,
        expireYear,
        cvc,
        amount,
        pointAmount,
        installmentCount,
        callbackURL
    );
```

### 3D Secure Tamamlama

Kullanıcı 3D Secure doğrulamasını tamamladıktan sonra, ödeme işlemini tamamlamak için `Complete3DS` metodunu kullanabilirsiniz:

```javascript
    const result = await parakolay.complete3DS(
        threeDSessionID,
        amount,
        installmentCount,
        cardHolderName,
        cardToken
    );
```

## Hata Yönetimi

SDK, API çağrıları sırasında oluşabilecek hataları yönetmek için kapsamlı bir yapı sunar. Her API metodu, başarılı bir sonuç veya hata detayları içeren bir yanıt döndürür. Kullanmak istediğiniz fonksiyon için hata yönetimi ekleyebilirsiniz.

# Destek ve Katkıda Bulunma

Bu kütüphane ile ilgili sorunlarınız veya önerileriniz varsa, lütfen GitHub üzerinden bir issue açın. Ayrıca, kütüphaneye katkıda bulunmak istiyorsanız, pull request'lerinizi bekliyoruz.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
