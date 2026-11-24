-- Mantenimiento previo a UniqueProductNames. Conserva el primer nombre por Id.
-- Los demás se distinguen por su código; no fusiona ni elimina registros.
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
SELECT Id,Code,Price,Stock,IsActive INTO #Before FROM Products;
SELECT * INTO #MovementsBefore FROM InventoryMovements;
SELECT * INTO #PurchasesBefore FROM Purchases;
SELECT * INTO #DetailsBefore FROM PurchaseDetails;

;WITH Ranked AS (
    SELECT Id,ROW_NUMBER() OVER (
        PARTITION BY UPPER(LTRIM(RTRIM(Name))) COLLATE Latin1_General_100_CI_AS ORDER BY Id
    ) AS Position FROM Products
)
UPDATE p SET Name=LEFT(LTRIM(RTRIM(p.Name)),150-LEN(s.Suffix))+s.Suffix
OUTPUT deleted.Id,deleted.Name AS PreviousName,inserted.Name AS NewName
FROM Products p JOIN Ranked r ON r.Id=p.Id
CROSS APPLY (SELECT N' (código '+p.Code+N')' AS Suffix) s
WHERE r.Position>1;

IF EXISTS (SELECT 1 FROM Products GROUP BY UPPER(LTRIM(RTRIM(Name))) COLLATE Latin1_General_100_CI_AS HAVING COUNT(*)>1)
    THROW 51000,'Persisten nombres duplicados: revisar manualmente. No se guardaron cambios.',1;
IF EXISTS (SELECT Id,Code,Price,Stock,IsActive FROM Products EXCEPT SELECT * FROM #Before)
 OR EXISTS (SELECT * FROM #Before EXCEPT SELECT Id,Code,Price,Stock,IsActive FROM Products)
 OR EXISTS (SELECT * FROM InventoryMovements EXCEPT SELECT * FROM #MovementsBefore)
 OR EXISTS (SELECT * FROM #MovementsBefore EXCEPT SELECT * FROM InventoryMovements)
 OR EXISTS (SELECT * FROM Purchases EXCEPT SELECT * FROM #PurchasesBefore)
 OR EXISTS (SELECT * FROM #PurchasesBefore EXCEPT SELECT * FROM Purchases)
 OR EXISTS (SELECT * FROM PurchaseDetails EXCEPT SELECT * FROM #DetailsBefore)
 OR EXISTS (SELECT * FROM #DetailsBefore EXCEPT SELECT * FROM PurchaseDetails)
    THROW 51001,'Se alteraron datos ajenos al nombre. No se guardaron cambios.',1;
COMMIT TRANSACTION;
