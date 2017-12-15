import java.io.*;
import java.util.*;
import java.lang.*;
import java.util.Arrays;
public class Main
{
public static void main(String args[]) throws Exception
	{
		Scanner cin=new Scanner(System.in);
		int counter=cin.nextInt();
		for (int i=0; i<counter; i++) 
		{
			int number_shops=cin.nextInt();
			int[] shops = new int[number_shops];
			for (int j=0;j<number_shops;j++) {
				shops[j] = cin.nextInt();
			}
			Arrays.sort(shops);
			System.out.println((shops[shops.length-1]-shops[0])*2);
		}
	}
}