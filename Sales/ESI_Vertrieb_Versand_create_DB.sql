use esi_sales;

create table customer (
customerID int primary key,
firstName varchar(15),
surName varchar(15),
company varchar(20),
street varchar(20),
PostCode int check(PostCode>00000 and Postcode<=99999),
city varchar(20),
country varchar(20),
phone varchar(20),
mail varchar(20) not null,
business boolean not null default 0
);

create table orderheader (
orderNr varchar(20) primary key,
customerID int not null,
orderDate date not null,
shippingDate date,
commentary varchar(200),
tested boolean,
toStock boolean not null default 0,
foreign key (customerID) references customer(customerID) on delete no action
);

create table articlenumber (
articleNr int primary key,
materialNr int,
motivNr int,
colorCode varchar(7)
);

create table orderdetails (
detailsID int,
prodOrderNr varchar(20) unique,
orderNr varchar(20),
lineItem int,
articleNr int,
colorCode varchar(7),
quantity int check (quantity>0),
price float,
materialNr int,
hasPrint boolean,
motivNr int,
toStock boolean not null,
primary key (detailsID),
foreign key (articleNr) references articlenumber(articleNr) on delete no action on update cascade
);

use esi_sales;

create table retour (
prodOrderNr varchar(20) primary key,
customeriD int,
lack varchar(200),
newProd boolean not null,
foreign key (prodOrderNr) references orderdetails(prodOrderNr) on delete no action on update cascade,
foreign key (customeriD) references customer(customeriD) on delete no action on update cascade
);

create table status (
prodOrderNr varchar(20) primary key,
orderNr varchar(20) not null,
statusID int,
Statusdescription varchar(50),
foreign key (prodOrderNr) references orderdetails(prodOrderNr) on delete no action on update cascade
);

