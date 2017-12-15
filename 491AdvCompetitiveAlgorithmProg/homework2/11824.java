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
		while (counter>0) {
			List<Integer> prices = new ArrayList<Integer>();
			double sum = 0;
			int price=cin.nextInt();
			while(price!=0)
			{
				prices.add(price);
				price=cin.nextInt();
			}
			Collections.sort(prices);
			int i = prices.size();
			for (int element:prices) {
				sum = sum + Math.pow(element, i);
				i--;
			}
			if ((2*sum)<=5000000) {
				System.out.println((int)(2*sum));
			}
			else{
				System.out.println("Too expensive");
			}
			counter--;	
		}
	}
}